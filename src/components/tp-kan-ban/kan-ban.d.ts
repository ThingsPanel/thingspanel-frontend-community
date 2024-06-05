import type { LayoutItem } from '@/components/drg-grid-layout';
import type { CardItemBase } from '@/cards2.0/card';

export type cardConfig = {
  basis: {
    title: string;
    showTitle: boolean;
    [propName: string]: any;
  };
  source: {
    dataSource?: any;
    [propName: string]: any;
  };
  cardUI: Record<string, any>;
  [propName: string]: any;
};

export interface CardData {
  cardItem: CardItemBase; // 和组件相关的东西
  cardId: string; // 卡片id
  renderID: string; /// 渲染id，请确保当前看板的唯一性  没有就是cardId
  config: cardConfig; // 配置数据
  sourceNumber: number;
}

export interface CardView extends LayoutItem {
  x: number;
  y: number;
  w: number;
  h: number;
  i: string | number; // cardId
  data?: CardData;
}

export interface CardFormIns {
  setCard: (card?: CardView | null) => void;
}

export interface IConfigCtx {
  config: cardConfig;
  view?: boolean; // 预览模式
}
