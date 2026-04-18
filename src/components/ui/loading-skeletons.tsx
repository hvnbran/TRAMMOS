import { cn } from "@/lib/utils";

/**
 * Elegant shimmer skeleton primitive.
 * Uses a subtle gradient sweep over the muted token for theme-consistent feel.
 */
export function Shimmer({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={style}
      className={cn(
        "relative overflow-hidden rounded-md bg-muted/60",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent",
        "before:animate-[shimmer_1.6s_ease-in-out_infinite]",
        className,
      )}
    />
  );
}

/** Stat card grid skeleton (4 KPI cards). */
export function StatsGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-border bg-card p-4 page-transition"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="flex items-center justify-between">
            <Shimmer className="h-3 w-24" />
            <Shimmer className="h-8 w-8 rounded-md" />
          </div>
          <Shimmer className="mt-3 h-7 w-16" />
        </div>
      ))}
    </div>
  );
}

/** Table-style list skeleton with header + rows. */
export function TableSkeleton({
  rows = 6,
  cols = 5,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="grid gap-3 border-b border-border bg-muted/30 px-4 py-3"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Shimmer key={i} className="h-3 w-20" />
        ))}
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            className="grid gap-3 px-4 py-4 page-transition"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              animationDelay: `${r * 50}ms`,
            }}
          >
            {Array.from({ length: cols }).map((_, c) => (
              <Shimmer
                key={c}
                className={cn("h-4", c === 0 ? "w-32" : c === cols - 1 ? "w-16" : "w-24")}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Card grid skeleton (e.g. formatos, vehículos card view). */
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-border bg-card p-4 space-y-3 page-transition"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="flex items-center justify-between">
            <Shimmer className="h-4 w-32" />
            <Shimmer className="h-5 w-16 rounded-full" />
          </div>
          <Shimmer className="h-3 w-full" />
          <Shimmer className="h-3 w-3/4" />
          <div className="flex justify-between pt-2">
            <Shimmer className="h-3 w-20" />
            <Shimmer className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Chart panel skeleton. */
export function ChartSkeleton({ height = 240 }: { height?: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 page-transition">
      <Shimmer className="h-4 w-40 mb-4" />
      <div className="flex items-end gap-2" style={{ height }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Shimmer
            key={i}
            className="flex-1"
            style={{ height: `${30 + ((i * 13) % 70)}%` } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  );
}

/** Compact page header skeleton. */
export function HeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Shimmer className="h-7 w-48" />
      <Shimmer className="h-3 w-72" />
    </div>
  );
}
