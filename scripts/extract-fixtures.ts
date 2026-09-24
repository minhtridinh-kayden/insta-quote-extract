import { mkdirSync, readdirSync } from "node:fs";

const pdfs = readdirSync("fixtures/pdfs").filter((f) => f.endsWith(".pdf"));
mkdirSync("out", { recursive: true });
console.log(`Found ${pdfs.length} fixtures; pipeline not implemented yet.`);
