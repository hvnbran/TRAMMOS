/**
 * Helpers para calcular métricas de tiempos de respuesta.
 * Las duraciones se devuelven en MINUTOS (números decimales).
 */

export function diffMin(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;
  const a = new Date(start).getTime();
  const b = new Date(end).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return (b - a) / 60000;
}

export function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid];
}

export function pctWithin(nums: number[], maxMin: number): number {
  if (nums.length === 0) return 0;
  const c = nums.filter((n) => n <= maxMin).length;
  return (c / nums.length) * 100;
}

export function formatMin(min: number | null | undefined): string {
  if (min == null || !Number.isFinite(min)) return "—";
  if (min < 1) return `${Math.round(min * 60)} s`;
  if (min < 60) return `${min.toFixed(1)} min`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** Buckets de SLA para asignación. */
export interface SlaBuckets {
  total: number;
  bajo5: number;
  bajo15: number;
  bajo30: number;
  sobre30: number;
}

export function computeSlaBuckets(durations: number[]): SlaBuckets {
  const total = durations.length;
  return {
    total,
    bajo5: durations.filter((d) => d <= 5).length,
    bajo15: durations.filter((d) => d > 5 && d <= 15).length,
    bajo30: durations.filter((d) => d > 15 && d <= 30).length,
    sobre30: durations.filter((d) => d > 30).length,
  };
}
