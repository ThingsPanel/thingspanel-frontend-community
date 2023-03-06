/*
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-01-29 14:11:24
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-06 16:59:59
 * @FilePath: \ThingsPanel-Backend-Vue\src\core\services\i18n.service.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const i18nService = {
  defaultLanguage: "ch",

  languages: [
    {
      lang: "en",
      name: "English",
      flag: process.env.BASE_URL + "media/svg/flags/226-united-states.svg"
    },
    {
      lang: "ch",
      name: "中文",
      flag: process.env.BASE_URL + "media/svg/flags/034-china.svg"
    }
    /*{
      lang: "es",
      name: "Spanish",
      flag: process.env.BASE_URL + "media/svg/flags/128-spain.svg"
    },
    {
      lang: "jp",
      name: "Japanese",
      flag: process.env.BASE_URL + "media/svg/flags/063-japan.svg"
    },
    {
      lang: "de",
      name: "German",
      flag: process.env.BASE_URL + "media/svg/flags/162-germany.svg"
    },
    {
      lang: "fr",
      name: "French",
      flag: process.env.BASE_URL + "media/svg/flags/195-france.svg"
    }*/
  ],

  /**
   * Keep the active language in the localStorage
   * @param lang
   */
  setActiveLanguage(lang) {
    localStorage.setItem("language", lang);
  },

  /**
   * Get the current active language
   * @returns {string | string}
   */
  getActiveLanguage() {
    return localStorage.getItem("language") || this.defaultLanguage;
  }
};

export default i18nService;
