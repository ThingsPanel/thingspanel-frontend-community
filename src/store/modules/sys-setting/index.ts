import { defineStore } from 'pinia';
import { fetchThemeSetting } from '@/service/api/setting';
import { localStg } from '@/utils/storage';
import { createServiceConfig } from '~/env.config';

const { otherBaseURL } = createServiceConfig(import.meta.env);
const url = new URL(otherBaseURL.demo ? otherBaseURL.demo : `${window.location.origin}/api/v1`);

type SysSetting = Omit<Api.GeneralSetting.ThemeSetting, 'id'>;
export const useSysSettingStore = defineStore('sys-setting', {
  state: (): SysSetting => ({
    system_name: '',
    logo_background: '',
    logo_loading: '',
    logo_cache: '',
    home_background: ''
  }),
  actions: {
    async initSysSetting() {
      const { error, data } = await fetchThemeSetting();
      // const { error, data } = await fetchUserRoutes(id)
      if (!error && data) {
        const list: Api.GeneralSetting.ThemeSetting[] = data.list;
        if (list.length) {
          const setting: Api.GeneralSetting.ThemeSetting = list[0];
          setting.logo_background = setting.logo_background ? url.origin + setting.logo_background.slice(1) : '';
          setting.logo_loading = setting.logo_loading ? url.origin + setting.logo_loading.slice(1) : '';
          setting.logo_cache = setting.logo_cache ? url.origin + setting.logo_cache.slice(1) : '';
          setting.home_background = setting.home_background ? url.origin + setting.home_background.slice(1) : '';
          localStg.set('logoLoading', setting.logo_loading);
          Object.assign(this.$state, setting);
        }
      }
    }
  }
});
