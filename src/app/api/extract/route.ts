import { handleExtract } from "@/lib/api";

export const runtime = "nodejs";

export function POST(request: Request): Promise<Response> {
  return handleExtract(request);
}
