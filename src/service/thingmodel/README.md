## ThingModel Frontend Service Modules

Entry points:

- `index.ts`: aggregate exports
- `thing-model.ts`: thing model CRUD and version APIs
- `thing-model-item.ts`: property/event/command item APIs
- `device-template.ts`: template APIs
- `product.ts`: product APIs
- `device.ts`: device CRUD, latest data, and actuate APIs
- `dictionary.ts`: built-in dictionary APIs
- `validate.ts`: validation helpers

Shared utilities:

- `@/service/thingmodel/client`
- `@/composables/useApi`
- `@/composables/useFormSubmit`
- `@/composables/useI18n`

These modules intentionally use Soybean's existing `request` wrapper and keep API
paths anchored at `/api/...` so they bypass the legacy `/api/v1` default base path.
