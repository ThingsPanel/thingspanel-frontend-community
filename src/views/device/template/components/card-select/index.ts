const builtinCards = import.meta.glob('@/card/builtin-card/*/index.ts', { eager: true });
const chartCards = import.meta.glob('@/card/chart-card/*/index.ts', { eager: true });

export const PanelCards = {
  builtin: Object.values(builtinCards).map((b: any) => b.default),
  device: [],
  chart: Object.values(chartCards).map((b: any) => b.default)
};
