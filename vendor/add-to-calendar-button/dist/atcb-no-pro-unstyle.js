/*!
 * @preserve
 * Add to Calendar Button
 * Deprecation shim for atcb-no-pro-unstyle.js
 * Creator: Jens Kuerschner (https://jekuer.com)
 * Project: https://github.com/add2cal/add-to-calendar-button
 * License: Elastic License 2.0 (ELv2) (https://github.com/add2cal/add-to-calendar-button/blob/main/LICENSE.txt)
 * Version: 3.1.1
 * Note:    DO NOT REMOVE THE COPYRIGHT NOTICE ABOVE!
 */
(function () {
  if (window.atcbShimLoaded) return;
  window.atcbShimLoaded = true;
  console.info("[add-to-calendar-button] atcb-no-pro-unstyle.js is deprecated and now only loads atcb.js next to it. Please embed atcb.js directly.");
  var current = document.currentScript;
  var base = current && current.src ? current.src.substring(0, current.src.lastIndexOf('/') + 1) : '';
  var script = document.createElement('script');
  script.src = base + "atcb.js";
  if (current && current.nonce) script.nonce = current.nonce;
  (document.head || document.documentElement).appendChild(script);
})();
