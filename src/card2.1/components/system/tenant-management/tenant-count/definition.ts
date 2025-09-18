import { defineCardComponent } from "@/card2.1/core/component-registry";
import component from "./component.vue";
import { $t } from "@/locales";

/**
 * @file 租户数量卡片 (Card 2.1)
 * @description 租户数量卡片定义文件，用于注册组件。
 */
export default defineCardComponent({
  type: "tenant-count",
  name: $t("card.tenantCount.title"),
  description: $t("card.tenantCount.description"), // 添加描述
  component,
  category: 'system',
  subcategory: 'tenant-management',
  presets: [
    {
      label: $t("card.preset.default"),
      width: 4,
      height: 4,
      options: {},
    },
  ],
});