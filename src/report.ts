// stdout contract (mini-spec guardrail 1) — deterministic output an agent can parse.
// v0 is additive-only: 0.3.0 added `audio` without renaming or removing existing fields.
// `contract` stamps the version INTO the output so agents can detect breaking changes —
// adding it later would itself have been a breaking change, hence it ships from day one.
export const CONTRACT = 'squish-cli-v0';

export interface AudioActivitySample {
  time: number;  // absolute seconds in the source video
  level: number; // 0..1, normalized against the full clip peak
}

export interface AudioActivity {
  present: boolean;
  normalization: 'clip_peak' | 'none';
  window: { start: number; end: number };
  samples: AudioActivitySample[];
}

export interface RunReport {
  input: string;
  duration: number; // seconds — always the FULL clip, even when windowed
  window?: { start: number; end: number }; // resolved zoom window — present ONLY when the caller passed one (spec I6)
  frames: number;   // total frames sampled (unreadable cells still counted — see warnings)
  sheets: number;   // sheet files produced
  files: string[];  // absolute output paths, sheet order
  audio: AudioActivity; // additive v0 metadata; timeline uses absolute source time
  warnings: string[];
}

export function formatJson(r: RunReport): string {
  // Key order is part of the contract — spell it out instead of trusting the caller's object.
  const { input, duration, window, frames, sheets, files, audio, warnings } = r;
  return JSON.stringify(
    window
      ? { input, duration, window, frames, sheets, files, audio, warnings, contract: CONTRACT }
      : { input, duration, frames, sheets, files, audio, warnings, contract: CONTRACT },
    null, 2,
  );
}

// MCP mouth contract — the CLI fields PLUS timecodes[][] (per sheet, from core data),
// stamped with its own marker since the shape differs from the CLI's.
export const MCP_CONTRACT = 'squish-mcp-v0';

export function formatMcpJson(r: RunReport, timecodes: string[][]): string {
  const { input, duration, window, frames, sheets, files, audio, warnings } = r;
  return JSON.stringify(
    window
      ? { input, duration, window, frames, sheets, files, audio, warnings, timecodes, contract: MCP_CONTRACT }
      : { input, duration, frames, sheets, files, audio, warnings, timecodes, contract: MCP_CONTRACT },
    null, 2,
  );
}

export function formatPlain(r: RunReport): string {
  const lines = [
    ...r.files,
    ...r.warnings.map((w) => `warning: ${w}`),
    `summary: duration=${r.duration}s sheets=${r.sheets} frames=${r.frames}`,
  ];
  return lines.join('\n') + '\n';
}
