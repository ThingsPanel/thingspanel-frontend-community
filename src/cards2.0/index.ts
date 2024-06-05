import systemCards from './system-card/index';
import pluginsCards from './plugins-card/index';
import chartCards from './chart-card/index';

export const KanBanCards = {
  system: Object.values(systemCards).map((b: any) => b.default),
  plugins: Object.values(pluginsCards).map((b: any) => b.default),
  chart: Object.values(chartCards).map((b: any) => b.default),
  device: [] as any[]
};
