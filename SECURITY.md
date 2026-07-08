# Security

If you believe you've found a security vulnerability in Squish — the CLI, the MCP server, or
the engine — please report it privately via
[GitHub security advisories](https://github.com/getsquish/squish/security/advisories/new).
Please don't open a public issue for security reports.

Scope notes:

- The CLI/MCP run locally and shell out to your system `ffmpeg`/`ffprobe`. Vulnerabilities in
  ffmpeg itself belong upstream — but "Squish passes hostile input to ffmpeg unsafely" is in
  scope here.
- The hosted API (`api.getsquish.app`) is not in this repo, but reports about it are welcome
  through the same channel.
