import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const CHIPS = ["w-28", "w-28", "w-36", "w-32"];
const ROWS = [0, 1, 2];

export function LoadingResult({ fileName }: { fileName: string }) {
  return (
    <div className="space-y-6">
      <p role="status" className="text-muted-foreground">
        Uploading and reading {fileName}…
      </p>
      <div aria-hidden="true" className="space-y-6 [&_[data-slot=skeleton]]:bg-foreground/10">
        <Card>
          <CardContent className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full max-w-md" />
            <Skeleton className="h-4 w-2/3 max-w-sm" />
          </CardContent>
        </Card>
        <div className="flex flex-wrap gap-2">
          {CHIPS.map((width, i) => (
            <Skeleton key={i} className={`h-7 rounded-full ${width}`} />
          ))}
        </div>
        <Card>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3">
            {ROWS.map((row) => (
              <div key={row} className="flex gap-4">
                <Skeleton className="h-4 w-6" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
