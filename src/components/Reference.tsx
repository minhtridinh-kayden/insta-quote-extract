export function Reference({ requestId }: { requestId?: string }) {
  if (!requestId) return null;
  return (
    <p className="text-sm text-stone-600">
      Reference: <code className="break-all font-mono">{requestId}</code>
    </p>
  );
}
