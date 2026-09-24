"use client";

import { FileUp } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAX_UPLOAD_MB } from "@/lib/schema";

type UploadFormProps = {
  busy: boolean;
  onSubmit: (file: File) => void;
};

export function UploadForm({ busy, onSubmit }: UploadFormProps) {
  const inputId = useId();
  const [file, setFile] = useState<File | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (file) onSubmit(file);
  };

  return (
    <Card>
      <CardContent>
        <form onSubmit={submit} className="space-y-3">
          <Label htmlFor={inputId}>Supplier document (PDF, up to {MAX_UPLOAD_MB} MB)</Label>
          <Input
            id={inputId}
            type="file"
            accept="application/pdf,.pdf"
            disabled={busy}
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <Button type="submit" disabled={!file || busy} className="w-full sm:w-auto">
            <FileUp aria-hidden="true" />
            {busy ? "Reading…" : "Read document"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
