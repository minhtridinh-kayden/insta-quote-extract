export function Reference({ requestId }: { requestId?: string }) {
  if (!requestId) return null;
  return (
    <p className="text-xs text-muted-foreground">
      Reference: <code className="break-all font-mono">{requestId}</code>
    </p>
  );
}
