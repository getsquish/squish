// stdout contract (mini-spec guardrail 1) — deterministic output an agent can parse.
// JSON shape is frozen for v0: { input, duration, frames, sheets, files[], warnings[], contract }.
// `contract` stamps the version INTO the output so agents can detect breaking changes —
// adding it later would itself have been a breaking change, hence it ships from day one.
export const CONTRACT = 'squish-cli-v0';

export interface RunReport {
  input: string;
  duration: number; // seconds — always the FULL clip, even when windowed
  window?: { start: number; end: number }; // resolved zoom window — present ONLY when the caller passed one (spec I6)
  frames: number;   // total frames sampled (unreadable cells still counted — see warnings)
  sheets: number;   // sheet files produced
  files: string[];  // absolute output paths, sheet order
  warnings: string[];
}

export function formatJson(r: RunReport): string {
  // Key order is part of the contract — spell it out instead of trusting the caller's object.
  const { input, duration, window, frames, sheets, files, warnings } = r;
  return JSON.stringify(
    window
      ? { input, duration, window, frames, sheets, files, warnings, contract: CONTRACT }
      : { input, duration, frames, sheets, files, warnings, contract: CONTRACT },
    null, 2,
  );
}

// MCP mouth contract — the CLI fields PLUS timecodes[][] (per sheet, from core data),
// stamped with its own marker since the shape differs from the CLI's.
export const MCP_CONTRACT = 'squish-mcp-v0';

export function formatMcpJson(r: RunReport, timecodes: string[][]): string {
  const { input, duration, window, frames, sheets, files, warnings } = r;
  return JSON.stringify(
    window
      ? { input, duration, window, frames, sheets, files, warnings, timecodes, contract: MCP_CONTRACT }
      : { input, duration, frames, sheets, files, warnings, timecodes, contract: MCP_CONTRACT },
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
