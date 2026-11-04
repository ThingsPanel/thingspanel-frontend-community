# Mini-program device details

`/mp-device/index.html` is a standalone mobile H5 entry for WeChat. It is built alongside the existing administrator UI. The App and original uni-app H5 details retain their existing renderer.

## Deployment

- Publish the full frontend build, including `mp-device/index.html` and its generated assets.
- Serve the page, `/api/v1`, `/api/v2`, `/thingsvis-api`, and the existing ThingsVis `/main/` and widget resources on the same HTTPS origin. Keep the HTML route ahead of any SPA fallback.
- Register the HTTPS origin as the mini-program business domain. Exported documents also require the existing server in the mini-program download domains.
- The App's existing service configuration determines the H5 origin. Do not commit localhost addresses into production settings.
- Native model bindings use the pinned model/snapshot/revision and permit writes only through commands; enterprise legacy templates keep their existing APIs.

## Authentication

The mini-program passes its existing session in the URL fragment. Bootstrap removes the fragment before loading application scripts. The H5 entry stores its own tab-scoped session, independently of the administrator UI. API credentials are sent only to the current deployment; redirects are rejected. This is **not** a single-use ticket exchange. The server remains responsible for permissions and token expiry.

## Local preview and checks

```powershell
$env:MP_DEVICE_PREVIEW_TARGET='https://cloud.thingspanel.cn'
node node_modules/vite/bin/vite.js --config vite.mp-device.config.ts
node --test src/features/mp-device-detail/session.test.mjs
# Requires Playwright and Chrome; all mutation requests are intercepted with fixtures.
$env:PLAYWRIGHT_MODULE='file:///absolute/path/to/playwright/index.mjs'
node src/features/mp-device-detail/browser.test.mjs
node node_modules/vite/bin/vite.js build --config vite.mp-device.config.ts
```

Preview: `http://127.0.0.1:5188/mp-device/index.html`. Open it through the mini-program device entry to supply a session; visiting it without a session must show an expired-login message. No credentials belong in source, screenshots, or build logs.

Browser fixtures cover 320/375px portrait and 844px landscape, history selection/cancellation, modal controls, tab navigation, mocked rename, and the ThingsVis initialization/render/height protocol. They do not replace iOS/Android WeChat physical-device testing. Validate actual chart rendering and mini-program return navigation before release.

Source lineage: App device details at `74e0509`; new H5 feature shared by community `feat/mp-device-detail`, demo `feat/mp-device-detail-demo`, and cloud `feat/mp-device-detail-cloud`. The existing deployment workflows are unchanged. Branch push alone does not prove a deployment ran.
