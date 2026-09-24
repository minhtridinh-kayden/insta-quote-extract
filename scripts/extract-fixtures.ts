import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { readPdf } from "../src/lib/extraction/pdf";
import { groupRows } from "../src/lib/extraction/rows";
import { pageSection } from "../src/lib/extraction/section";
import { extractTable } from "../src/lib/extraction/table";

const FIXTURES = "fixtures/pdfs";
const OUT = "out";

async function extractFixture(name: string) {
  const result = await readPdf(new Uint8Array(readFileSync(path.join(FIXTURES, name))));
  if (!result.ok) return { fileName: name, failure: result.failure };
  const pages = result.pages.map((read) => {
    if (read.kind !== "text") return read;
    const rows = groupRows(read.runs);
    const section = pageSection(read.page, rows);
    return { page: read.page, section: section.value, ...extractTable(read.page, section.value, rows) };
  });
  return { fileName: name, pages };
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  for (const name of readdirSync(FIXTURES).filter((f) => f.endsWith(".pdf")).sort()) {
    const target = path.join(OUT, name.replace(/\.pdf$/, ".json"));
    try {
      writeFileSync(target, `${JSON.stringify(await extractFixture(name), null, 2)}\n`);
      console.log(`${name} → ${target}`);
    } catch (error) {
      process.exitCode = 1;
      console.error(`${name} failed:`, error);
    }
  }
}

void main();
