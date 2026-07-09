---
description: Reference for the hosted Squish API — authentication, request/response shapes, errors, retry policy, caps, and credit pricing.
---

# Hosted API

The hosted API turns an **intentionally uploaded** video into timestamped contact-sheet
JPEGs plus JSON metadata and timecodes. Use it when a workflow can't run the local
[CLI](cli.md)/[MCP](mcp.md) tools (CI, serverless, hosted agents, no ffmpeg). For local
workflows, prefer the CLI/MCP server — they process everything on your machine and upload
nothing. See [Privacy and data flow](../the-primitive/privacy-and-data-flow.md).

Contract string: `squish-http-v0` (see [Stability and versioning](stability.md)).

## Endpoint

```
POST https://api.getsquish.app/v1/squish
```

One synchronous request is the whole job — there is no job queue API, no polling
endpoint, no webhooks.

## Authentication

- Header: `Authorization: Bearer <key>`
- Key shape: `sq_live_` + 40 hex characters, minted on
  [getsquish.app/api-keys](https://getsquish.app/api-keys) (email OTP sign-in).
- The plaintext key is shown **once** — only its SHA-256 hash is stored, so a lost key
  can't be recovered, only replaced.
- A missing, malformed, or revoked key returns `401 invalid_key` before the body is read.

## Request

`multipart/form-data` with exactly one file field, and it must be named **`video`**
(`video=@clip.mov`); other file parts are ignored.

Optional form fields:

| Field | Values | Default | Notes |
|---|---|---|---|
| `density` | `3x3`, `4x4`, `5x5`, `6x6` | `3x3` | Higher density costs more credits per sheet ([Credits](#credits-and-pricing)). |
| `response` | `json`, `image` | `json` | `image` returns the first sheet JPEG directly ([below](#responseimage)). |

{% hint style="warning" %}
**No zoom window yet.** The hosted API does not accept `start`/`end` — a request always
covers the whole clip, and any `start`/`end` fields you send are ignored. The
[navigation loop](../the-primitive/the-navigation-loop.md)'s zoom step is local
CLI/MCP-only today. Window support arrives with video sessions (upload-once,
squish-many).
{% endhint %}

## JSON response

```json
{
  "job_id": "...",
  "input": "clip.mov",
  "duration": 10.0,
  "frames": 9,
  "sheets": 1,
  "density": "3x3",
  "credits_charged": 1,
  "credits_remaining": 33,
  "files": ["https://api.getsquish.app/v1/sheets/<job_id>/video.sheet-1.jpg"],
  "timecodes": [["0:00", "0:01", "0:02", "0:03", "0:05", "0:06", "0:07", "0:08", "0:10"]],
  "warnings": [],
  "contract": "squish-http-v0"
}
```

`files` are temporary capability URLs (see [Job lifecycle](#job-lifecycle)). Sheet files
are always named `video.sheet-N.jpg` — the server stores the upload under its own fixed
name, so the original filename never appears in the URLs; it is echoed in the `input`
field instead (see the [filename contract](sheet-format.md#filename-contract)).
`timecodes[][]` always matches the labels stamped on the sheet pixels — format `m:ss`,
sub-second `m:ss.d` on short clips where whole seconds could not tell adjacent cells
apart (see the [sheet-format spec](sheet-format.md#timecode-grammar)). Long clips produce
several sheets, in order — read them all.

### response=image

`response=image` returns the **first** sheet JPEG directly instead of JSON, with the
metadata in headers: `x-squish-job` (the job id) and `x-credits-remaining`. Multi-sheet
jobs should use the default JSON mode — image mode carries no URLs for the other sheets
and no timecodes.

## Errors

| Status | Error | Meaning | What to do |
|---:|---|---|---|
| `401` | `invalid_key` | Credential missing, revoked, or wrong | Create/copy a key from [`/api-keys`](https://getsquish.app/api-keys). |
| `402` | `insufficient_credits` | Balance too low — for a never-paid account the free daily allowance was already auto-applied before this error | Top up on `/api-keys`, lower `density`, or send a shorter clip; a never-paid account can also wait for the next UTC day. |
| `413` | `too_large` | Upload exceeds the current cap (`max_mb` in the body) | Trim/compress or use a shorter clip / lower density. |
| `422` | `bad_request` | Wrong request shape, or bad `density`/`response` value | Correct the request before retrying. |
| `422` | `unreadable_video` | The upload could not be probed as a video | Send a real video file in a common container. |
| `422` | `too_long` | Duration exceeds the cap (`max_s` in the body) | Trim the clip or send a shorter one. |
| `429` | `busy` | The single-job worker is full | Wait and retry later. |
| `500` | `processing_failed` | Engine failed after the charge | Body is `{ "error": "processing_failed", "refunded": true\|false }` — **check `refunded`**: `true` → retry once; `false` → the charge stands, report instead of retrying. |

## Retry policy

What's safe to retry follows from when money moves — credits are deducted atomically
*after* the exact price is known, *before* frame extraction:

- **`401` `402` `413` `422` — don't retry unchanged.** Nothing was charged; the same
  request will fail the same way. Fix the cause first (new key, top-up, smaller/shorter
  clip, corrected fields).
- **`429` — safe to retry.** Nothing was charged; the service runs one job at a time
  with a short queue. Jobs take seconds (a 12 s clip ≈ 6 s), so retry after a short wait
  (~10–30 s). There is no `Retry-After` header in `squish-http-v0`.
- **`500` — read `refunded` in the body before retrying.** `refunded: true` (the normal
  case): the charge came back automatically — retry once, report if it fails twice.
  `refunded: false` (rare): the automatic refund itself failed and the charge stands —
  do **not** blind-retry; the usage table on `/api-keys` records the real net cost.
- **No idempotency keys.** Every accepted request is a new job and a new charge — do not
  blindly re-send a request that may have succeeded (a dropped connection *after*
  processing still charged; check the usage table on `/api-keys`).

## Job lifecycle

1. The upload streams to disk (never buffered in memory).
2. Probe → plan → price → atomic credit deduction → frame extraction → response.
3. The connection stays open for the duration (seconds for typical clips).
4. `job_id` in the response is a receipt: it appears in the sheet URLs and in your usage
   table on `/api-keys`.
5. **The uploaded video is deleted the moment the job ends**, success or failure. No copy
   is kept.
6. Sheets live at their capability URLs for **about 24 hours**, then a sweep deletes
   them. Download to keep.

## Caps

Current v0 limits:

- Upload cap: **300 MB**
- Duration cap: **30 min**
- One job processing at a time, with a small queue; overload returns `429 busy`
- Outputs are temporary, not permanent storage

## Credits and pricing

Credits are prepaid and charged **per output sheet**, by density:

| Density | Credits per sheet |
|---|---:|
| `3x3` | 1 |
| `4x4` | 2 |
| `5x5` | 3 |
| `6x6` | 5 |

Live packs: **$3 = 30 credits · $9 = 120 credits · $29 = 500 credits.**

### Free daily allowance

An account that has **never purchased anything** (no web Pro, no credit pack) is topped
up to a small floor — currently **7 credits** — at most once per **UTC day**, at the
first priced request of the day that finds the balance below the floor. It is a
top-up-to-floor, not an increment: unused allowance never stacks (yesterday's leftover
reduces today's grant, so one UTC day's consumption never exceeds the floor), nothing is
granted at or above the floor, and a purchased balance is never touched.

## Health check

```
GET https://api.getsquish.app/healthz
```

Returns `{ "ok": true, "contract": "squish-http-v0", "version": "…" }` — no auth
required. Useful for an agent to distinguish "API down" from "my request is wrong".

## What a sheet is — and is not

So agents set the right expectations:

- **Visual only.** A sheet carries no audio, speech, or transcript. Squish sees; it does
  not hear.
- **A sequence map, not a motion replacement.** Frames are sampled across the clip;
  events between samples are invisible. Denser grids (`4x4`–`6x6`) shrink the gaps, they
  don't eliminate them.
- **Output is JPEG contact sheet(s) only** (quality 0.70), densities `3x3`–`6x6`.
- **No analysis happens server-side.** The API returns the artifact; the
  reading/reasoning is the calling model's job.
