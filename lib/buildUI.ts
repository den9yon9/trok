import * as esbuild from "https://deno.land/x/esbuild@v0.24.1/mod.js";
import { resolve } from "@std/path/resolve";

const __dirname = new URL(".", import.meta.url).pathname;

await esbuild.build({
  entryPoints: [resolve(__dirname, "..", "ui", "main.tsx")],
  bundle: false,
  minify: false,
  sourcemap: false,
  target: ["es2022"],
  platform: "neutral",
  outfile: resolve(__dirname, "..", "static", "main.js"),
});
await esbuild.stop();

const codeEntry = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link
      href="https://cdn.jsdelivr.net/npm/daisyui@4.12.23/dist/full.min.css"
      rel="stylesheet"
      type="text/css"
    />
    <script src="https://cdn.tailwindcss.com"></script>
    <title>TorkHub</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.js"></script>
  </body>
</html>
`;

Deno.writeTextFileSync(
  resolve(__dirname, "..", "static", "index.html"),
  codeEntry,
);
