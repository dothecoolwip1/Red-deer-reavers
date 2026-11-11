export function qrSvg(text: string, options?: { logo?: string | null; margin?: number; px?: number }): string;
export function makeTransparent(svg: string): string;
export function qrRuns(text: string, options?: { logo?: boolean; margin?: number }): { size: number; runs: [number, number, number][] };
export function qrBadge(size: number): { badge: number; at: number; pad: number };
