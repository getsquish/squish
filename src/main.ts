// squish CLI — mouth #1 of the Node engine. Parses argv, delegates to the shared
// engine (engine.ts — the MCP server in mcp.ts uses the same one), prints the
// agent stdout contract, and maps errors to exit codes.
import { isMcpCommand, parseArgs, USAGE, UsageError } from './args.ts';
import { runSquish } from './engine.ts';
import { formatJson, formatPlain } from './report.ts';

async function main(argv: string[]): Promise<number> {
  if (isMcpCommand(argv)) {
    await import('./mcp.ts'); // boots the stdio server (top-level await connect)
    return new Promise(() => {}); // server owns the process — exit() must never fire
  }
  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
    console.log(USAGE);
    return argv.length === 0 ? 1 : 0;
  }

  const args = parseArgs(argv);
  const { report } = await runSquish({
    input: args.input, density: args.density, outDir: args.out,
    start: args.start, end: args.end,
  });
  process.stdout.write(args.json ? formatJson(report) + '\n' : formatPlain(report));
  return 0;
}

main(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (err) => {
    const msg = err instanceof UsageError ? `${err.message}\n${USAGE}` : String(err?.message ?? err);
    process.stderr.write(msg + '\n');
    process.exit(1);
  },
);
