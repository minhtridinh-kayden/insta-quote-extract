import { MAX_UPLOAD_BYTES } from "@/lib/schema";

const MULTIPART_OVERHEAD_BYTES = 64 * 1024;

export type Upload =
  | { kind: "file"; fileName: string; bytes: Uint8Array }
  | { kind: "missing"; detail: string }
  | { kind: "too_large"; size: number };

export async function readUpload(request: Request): Promise<Upload> {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_UPLOAD_BYTES + MULTIPART_OVERHEAD_BYTES) return { kind: "too_large", size: declared };

  let form: FormData;
  try {
    form = await request.formData();
  } catch (error) {
    return { kind: "missing", detail: `body is not multipart/form-data: ${error instanceof Error ? error.message : error}` };
  }

  const file = form.get("file");
  if (!(file instanceof File)) return { kind: "missing", detail: 'no "file" field in the form' };
  if (file.size > MAX_UPLOAD_BYTES) return { kind: "too_large", size: file.size };
  return { kind: "file", fileName: file.name, bytes: new Uint8Array(await file.arrayBuffer()) };
}
