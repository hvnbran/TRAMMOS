import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, openBrowser } from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const compId = process.argv[2];
const outFile = process.argv[3];
if (!compId || !outFile) {
  console.error("Usage: node render-remotion.mjs <compositionId> <outputPath>");
  process.exit(1);
}

console.log(`[render] Bundling…`);
const bundled = await bundle({
  entryPoint: path.resolve(__dirname, "../src/index.ts"),
  webpackOverride: (c) => c,
});

console.log(`[render] Launching browser…`);
const browser = await openBrowser("chrome", {
  browserExecutable: process.env.PUPPETEER_EXECUTABLE_PATH ?? "/bin/chromium",
  chromiumOptions: {
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  },
  chromeMode: "chrome-for-testing",
});

console.log(`[render] Selecting composition ${compId}…`);
const composition = await selectComposition({
  serveUrl: bundled,
  id: compId,
  puppeteerInstance: browser,
});

console.log(`[render] Rendering ${composition.durationInFrames} frames → ${outFile}`);
await renderMedia({
  composition,
  serveUrl: bundled,
  codec: "h264",
  outputLocation: outFile,
  puppeteerInstance: browser,
  muted: true,
  concurrency: 1,
  onProgress: ({ progress }) => {
    if (Math.floor(progress * 100) % 10 === 0) process.stdout.write(`.${Math.floor(progress*100)}%`);
  },
});

await browser.close({ silent: false });
console.log(`\n[render] Done: ${outFile}`);
