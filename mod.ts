import { parseArgs } from "@std/cli/parse-args";
import Builder from "./lib/Builder.ts";
import serve from "./lib/serve.tsx";

const args = parseArgs(Deno.args);

const [command] = args._;

if (command === "serve") serve(args.port ?? 3010);
if (command === "build") {
  const [repository] = Builder.workspace;
  Builder.run({
    id: String(Math.round(Math.random() * 100000000)),
    origin: args.origin ?? repository.origin,
    branch: args.branch ?? repository.branch,
    selector: args.selector ?? "HEAD^...HEAD",
  });
}

if (!command || args.help || args.h) {
  // TODO: show help

  Deno.exit(0);
}
