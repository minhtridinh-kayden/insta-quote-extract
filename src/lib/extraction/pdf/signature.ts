const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46, 0x2d]; // "%PDF-"

export function hasPdfSignature(bytes: Uint8Array): boolean {
  return PDF_MAGIC.every((byte, i) => bytes[i] === byte);
}
