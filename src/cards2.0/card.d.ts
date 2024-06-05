export type CardType = 'system' | 'plugins' | 'chart';
export type SceneType = 'mobile' | 'pc' | 'all';

export interface CardItemBase {
  type: CardType; // 卡片类型
  id: string; // 卡片唯一标识，按照card_type_cardName命名不会错
  cardName: string; // 卡片名字
  renderID?: string;
  sourceNumber: number; // 数据个数，必须限制，开发卡片时想好
  basicSettings?: {
    defaultTitle?: string; // 卡片标题 尽量使用国际化标题
    showTitle?: boolean;
  }; // 初始标题 可以不定义
  scene?: SceneType; // 'mobile' | 'pc' | 'all';，暂时没用可以不管
  minWH?: {
    minW: number | -1; // 卡片最小宽度,数字则表示占几列，当前默认共24格，-1为不限，自行计算
    minH: number | -1; // 卡片最小高度,数字则表示占几行，当前默一行30px，-1为不限，自行计算
  };
  preset?: Record<string, any>; // 初始设定,可自定义
}

export interface CardItem {
  cardItemBase: CardItemBase;
  poster: any; // 示例图 尺寸193*120
  component: any; // 卡片组件，一般就是 ./component.vue
  configForm: any; // 卡片配置文件，一般就是 card-config.vue
}
