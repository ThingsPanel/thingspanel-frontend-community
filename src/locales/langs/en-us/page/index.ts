// Import English locale for products
import { productLocaleEn } from '@/views/product/locales/en';
// Import login page locale
import login from '@/locales/langs/en-us/page/login';
// Import about page locale
import about from '@/locales/langs/en-us/page/about';
// Import home page locale
import home from '@/locales/langs/en-us/page/home';
// Import function page locale, using 'fn' alias to avoid keyword conflict
import fn from '@/locales/langs/en-us/page/function';
// Import manage page locale
import manage from '@/locales/langs/en-us/page/manage';
// Import data forward page locale
import dataForward from '@/locales/langs/en-us/page/dataForward';
// Import expect page locale
import expect from '@/locales/langs/en-us/page/expect';
// Import irrigation page locale
import irrigation from '@/locales/langs/en-us/page/irrigation';
// Import apply page locale
import apply from '@/locales/langs/en-us/page/apply';

export default {
  product: productLocaleEn,
  login,
  about,
  home,
  function: fn, // map back to 'function' key
  manage,
  dataForward,
  expect,
  irrigation,
  apply
};
