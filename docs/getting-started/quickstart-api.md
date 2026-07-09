---
description: The hosted Squish API — POST a clip, get timestamped contact sheets back. For CI, serverless, and machines without ffmpeg.
---

# Quickstart: Hosted API

**Give AI random access to video.** The hosted API is the remote path into the same engine as
the CLI and MCP server: `POST` a video, get back timestamped contact sheet JPGs plus JSON
metadata with every cell's timecode. Use it when a workflow cannot run the local tools — CI,
serverless, hosted agents, or any machine without ffmpeg.

{% hint style="info" %}
**This path is an intentional upload — to a compute service, not a storage service.** The
uploaded video is deleted the moment the job ends, success or failure; it is never retained
and never used for training. Output sheets are a temporary cache at capability URLs (about
24 hours), then expire automatically — download to keep. Need stronger guarantees? Run
Squish locally: the [CLI](quickstart-cli.md) and [MCP server](quickstart-mcp.md) never
upload your videos.
{% endhint %}

## Get a key

1. Open [getsquish.app/api-keys](https://getsquish.app/api-keys) and sign in with an email
   code.
2. Buy a credit pack ($3 = 30 · $9 = 120 · $29 = 500 credits) — or skip this step: an account
   that has never purchased anything gets a free daily allowance applied automatically on its
   first request.
3. Create a key and copy it **once**. Keys look like `sq_live_` + 40 hex characters; only a
   hash is stored, so a lost key can't be recovered, only replaced.

## First request

Endpoint: `POST https://api.getsquish.app/v1/squish`. Authenticate with
`Authorization: Bearer <key>`; send `multipart/form-data` with exactly one file field named
**`video`**:

```bash
curl -s -X POST https://api.getsquish.app/v1/squish \
  -H "Authorization: Bearer sq_live_…" \
  -F "video=@clip.mov" \
  -F "density=3x3"
```

Optional fields: `density` (`3x3`–`6x6`, default `3x3` — higher density costs more credits per
sheet) and `response` (`json` default, or `image` to get the first sheet JPG back directly,
with metadata in `x-squish-job` and `x-credits-remaining` headers).

## The response

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

One synchronous request is the whole lifecycle — no job queue, no polling, no webhooks; the
connection stays open for the duration (seconds for typical clips). `job_id` is a receipt: it
appears in the sheet URLs and in your usage table on
[getsquish.app/api-keys](https://getsquish.app/api-keys). The `contract` field
(`squish-http-v0`) is the version marker — parse it to detect breaking changes.

## Credits and the free daily allowance

Credits are prepaid and charged per output sheet by density: `3x3` = 1 · `4x4` = 2 · `5x5` = 3
· `6x6` = 5. The exact cost is known **before** any frame is extracted; an engine failure after
the charge refunds automatically.

An account that has **never purchased anything** (no web Pro, no credit pack) is topped up to a
small floor — currently **7 credits** — at most once per **UTC day**, at the first priced
request of the day that finds the balance below the floor. It is a top-up-to-floor, not an
increment: unused allowance never stacks, nothing is granted at or above the floor, and a
purchased balance is never touched.

## Limits worth knowing

- Upload cap: **300 MB**. Duration cap: **30 minutes**.
- One job processes at a time with a short queue — overload returns `429 busy` (nothing
  charged; safe to retry after ~10–30 s).
- **No `start`/`end` window yet.** A hosted request always covers the whole clip; `start`/`end`
  fields are ignored. The local [CLI](quickstart-cli.md) and
  [MCP server](quickstart-mcp.md) accept `start`/`end` for the
  [navigation loop](../the-primitive/the-navigation-loop.md).
- Liveness: `GET https://api.getsquish.app/healthz` (no auth) — distinguishes "API down" from
  "my request is wrong".

The full error table (`401` / `402` / `413` / `422` / `429` / `500` with the `refunded` field)
and the retry policy live in the [HTTP API reference](../reference/http-api.md).

## Next

- [HTTP API reference](../reference/http-api.md) — errors, retry policy, caps, and the frozen
  contract.
- [Privacy and data flow](../the-primitive/privacy-and-data-flow.md) — how the three
  processing paths (web, local CLI/MCP, hosted API) differ.
