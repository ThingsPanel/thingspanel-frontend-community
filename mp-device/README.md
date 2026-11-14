# Mini-program device details

`/mp-device/index.html` is a standalone mobile H5 entry for WeChat. It is built alongside the existing administrator UI. The App and original uni-app H5 details retain their existing renderer.

## Deployment

- Publish the full frontend build, including `mp-device/index.html` and its generated assets.
- `pnpm build` builds the administrator UI first, then builds the mobile entry independently into `dist/mp-device/assets`. This prevents administrator chart/editor chunks from entering the mobile startup download. A 128 KiB gzip budget covers the entry's static JS/CSS imports; history charts remain lazy-loaded.
- Deploy ThingsVis with `main/miniViewer.html` to enable its viewer-only entry. The host checks the HTML capability marker without credentials while device/board metadata loads. Missing files, SPA fallbacks, network errors and a 1.2-second timeout retain the original `/main/` entry, so either deployment order is supported. Native App entry URLs are unchanged.
- Serve the page, `/api/v1`, `/api/v2`, `/thingsvis-api`, and the existing ThingsVis `/main/` and widget resources on the same HTTPS origin. Keep the HTML route ahead of any SPA fallback.
- Register the HTTPS origin as the mini-program business domain. Exported documents also require the existing server in the mini-program download domains.
- The App's existing service configuration determines the H5 origin. Do not commit localhost addresses into production settings.
- Native model bindings use the pinned model/snapshot/revision and permit writes only through commands; enterprise legacy templates keep their existing APIs.

## Authentication

The mini-program passes its existing session in the URL fragment. Bootstrap removes the fragment before loading application scripts. The H5 entry stores its own tab-scoped session, independently of the administrator UI. API credentials are sent only to the current deployment; redirects are rejected. This is **not** a single-use ticket exchange. The server remains responsible for permissions and token expiry.

## Local preview and checks

```powershell
$env:MP_DEVICE_PREVIEW_TARGET='https://cloud.thingspanel.cn'
node node_modules/vite/bin/vite.js --config build/mp-device.config.ts
node --test src/features/mp-device-detail/session.test.mjs
# Requires Playwright and Chrome; all mutation requests are intercepted with fixtures.
$env:PLAYWRIGHT_MODULE='file:///absolute/path/to/playwright/index.mjs'
node src/features/mp-device-detail/browser.test.mjs
node src/features/mp-device-detail/board.browser.test.mjs
# Repeat with the viewer-only capability enabled in the fixtures.
$env:MP_VIEWER_ENTRY='mini'
node src/features/mp-device-detail/browser.test.mjs
node src/features/mp-device-detail/board.browser.test.mjs
node --test src/features/mp-device-detail/viewer-entry.test.mjs
node node_modules/vite/bin/vite.js build --config build/mp-device.config.ts
```

Preview: `http://127.0.0.1:5188/mp-device/index.html`. Open it through the mini-program device entry to supply a session; visiting it without a session must show an expired-login message. No credentials belong in source, screenshots, or build logs.

Browser fixtures cover 320/375px portrait and 844px landscape, history selection/cancellation, modal controls, tab navigation, mocked rename, and the ThingsVis initialization/render/height protocol. They do not replace iOS/Android WeChat physical-device testing. Validate actual chart rendering and mini-program return navigation before release.

Source lineage: App device details at `74e0509`; new H5 feature shared by community `feat/mp-device-detail`, demo `feat/mp-device-detail-demo`, and cloud `feat/mp-device-detail-cloud`. The existing deployment workflows are unchanged. Branch push alone does not prove a deployment ran.
