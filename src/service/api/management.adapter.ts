import type { ElegantRoute } from '@elegant-router/types';
import type { ElegantConstRoute } from '@elegant-router/vue';
import { getRouteName } from '@/router/elegant/transform';

/**
 * 递归处理数据
 *
 * @param treeNode
 * @param depth
 */
function processTree(treeNode: Api.Route.MenuRoute): void {
  // 处理当前节点
  treeNode.authority = treeNode.authority ? JSON.parse(treeNode.authority) : [];
  // 递归处理子节点
  if (treeNode.children) {
    for (const childNode of treeNode.children) {
      processTree(childNode);
    }
  }
}

export function adapterOfFetchRouterList(data: Api.Route.Data): Api.Route.MenuRoute[] {
  if (!data?.list) return [];
  return data.list.map(item => {
    processTree(item);
    return item;
  });
}

const LAYOUT_PREFIX = 'layout.';
const VIEW_PREFIX = 'view.';
const FIRST_LEVEL_ROUTE_COMPONENT_SPLIT = '$';

function transformLayoutAndPageToComponent(layout: string, page: any) {
  const hasLayout = Boolean(layout);
  const hasPage = Boolean(page);

  if (hasLayout && hasPage) {
    return `${LAYOUT_PREFIX}${layout}${FIRST_LEVEL_ROUTE_COMPONENT_SPLIT}${VIEW_PREFIX}${page}`;
  }

  if (hasLayout) {
    return `${LAYOUT_PREFIX}${layout}`;
  }

  if (hasPage) {
    return `${VIEW_PREFIX}${page}`;
  }

  return '';
}

/** 递归处理数据 */
function replaceKeys(data: ElegantConstRoute[]): ElegantRoute[] {
  return data.map((item: any): ElegantRoute => {
    // if (!item.parent_id) {
    //   if (!item.route_path.includes('$')) {
    //     if (item.route_path === 'layout.base') {
    //       item.route_path += '$home';
    //     } else {
    //       item.route_path = `layout.base$${item.route_path}`;
    //     }
    //   }
    // }
    // if (item.route_path === 'layout.base' && item.children.length === 0) {
    //   item.route_path += '$home';
    // }
    const homeRoutePath = getRouteName(item.param1);
    let component = '';
    if (item.parent_id === '0') {
      component = transformLayoutAndPageToComponent('base', item.element_type === 1 ? '' : homeRoutePath);
    } else {
      component = transformLayoutAndPageToComponent(
        item.element_type === 1 ? 'base' : '',
        item.element_type === 1 ? '' : homeRoutePath
      );
    }
    return {
      // id: item.id,
      // parentId: item.parent_id,
      name: item.element_code.trim().replace(/\s/g, '_'),
      // elementType: item.element_type,
      path: item.param1 && item.param1[0] === '/' ? item.param1 : (`/${item.param1}` as string),
      // component: item.route_path.trim().replace(/\s/g, '_'),
      component,
      // remark: item.remark,
      meta: {
        title: item.description,
        i18nKey: item.multilingual,
        requiresAuth: true,
        // permissions: JSON.parse(item.authority),
        // roles: JSON.parse(item.authority),
        permissions: [],
        roles: [],
        icon: item.param2,
        order: item.orders,
        hideInMenu: item.param3 === '1',
        remark: item.remark || ''
      },
      children: item.children?.length ? replaceKeys(item.children) : []
    } as unknown as ElegantRoute;
  });
}

export function adapterOfFetchUserRouterList(data: ElegantConstRoute[]): ElegantConstRoute[] {
  if (!data.length) return [];
  return replaceKeys(data).map((item: ElegantConstRoute): ElegantConstRoute => {
    if (!item.children || !item.children.length) {
      if (!item.meta) return item;
      item.meta.singleLayout = 'base';
    }
    return item;
  });
}
