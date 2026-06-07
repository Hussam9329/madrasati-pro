/**
 * Skeleton loading component used by all route loading.tsx files.
 * Provides a visually appealing placeholder that matches the app's design.
 */
export function PageSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-[1350px] flex-col gap-6 animate-pulse-soft">
      {/* Header skeleton */}
      <div className="flex flex-col gap-2">
        <div className="h-8 w-48 rounded-xl bg-[var(--color-app-border-soft)]" />
        <div className="h-5 w-80 rounded-lg bg-[var(--color-app-border-soft)]" />
      </div>

      {/* Alert skeleton */}
      <div className="h-16 w-full rounded-2xl bg-[var(--color-app-border-soft)]" />

      {/* Entry panel skeleton */}
      <div className="h-32 w-full rounded-2xl bg-[var(--color-app-card)] border border-[var(--color-app-border-soft)]" />

      {/* Stats grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="app-card p-5">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-[var(--color-app-border-soft)]" />
              <div className="flex flex-col gap-2">
                <div className="h-4 w-20 rounded bg-[var(--color-app-border-soft)]" />
                <div className="h-7 w-12 rounded bg-[var(--color-app-border-soft)]" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Card skeleton */}
      <div className="app-card p-5">
        <div className="flex flex-col gap-4">
          <div className="h-5 w-40 rounded bg-[var(--color-app-border-soft)]" />
          <div className="grid gap-3 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-11 w-full rounded-xl bg-[var(--color-app-border-soft)]" />
            ))}
          </div>
        </div>
      </div>

      {/* Table skeleton */}
      <div className="app-card overflow-hidden">
        <div className="h-14 border-b border-[var(--color-app-border-soft)] p-5">
          <div className="h-5 w-32 rounded bg-[var(--color-app-border-soft)]" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 border-b border-[var(--color-app-border-soft)] p-5">
            <div className="h-14 w-14 rounded-3xl bg-[var(--color-app-border-soft)]" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-5 w-40 rounded bg-[var(--color-app-border-soft)]" />
              <div className="h-4 w-64 rounded bg-[var(--color-app-border-soft)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
