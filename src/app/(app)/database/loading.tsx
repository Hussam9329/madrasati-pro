import { Loader2 } from "lucide-react";

export default function DatabaseLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="animate-spin text-[var(--app-text-muted)]" size={32} />
    </div>
  );
}
