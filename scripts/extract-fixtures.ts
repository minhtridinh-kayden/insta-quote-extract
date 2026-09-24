import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { extractDocument } from "../src/lib/extraction/pipeline";

const FIXTURES = "fixtures/pdfs";
const OUT = "out";

async function main() {
  mkdirSync(OUT, { recursive: true });
  for (const fileName of readdirSync(FIXTURES).filter((f) => f.endsWith(".pdf")).sort()) {
    const target = path.join(OUT, fileName.replace(/\.pdf$/, ".json"));
    try {
      const bytes = new Uint8Array(readFileSync(path.join(FIXTURES, fileName)));
      const outcome = await extractDocument(bytes, { fileName, requestId: "fixture" });
      writeFileSync(target, `${JSON.stringify(outcome, null, 2)}\n`);
      console.log(`${fileName} → ${target}`);
    } catch (error) {
      process.exitCode = 1;
      console.error(`${fileName} failed:`, error);
    }
  }
}

void main();
