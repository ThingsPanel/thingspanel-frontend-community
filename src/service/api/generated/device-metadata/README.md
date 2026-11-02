# Device Metadata generated contract

`types.ts` is generated from the authoritative `backend/docs/initiatives/device-metadata-native-cutover/openapi.yaml` with `openapi-typescript@7.13.0`. The generation script mechanically lifts the complete generated `NativeThingModelJsonValue` recursive union expression into a top-level named alias (`recursive-schema-alias-v1`) because TypeScript rejects the generator's recursive reference through `components["schemas"]` (TS2502). It replaces only those self-reference tokens; the union members and wire shape remain unchanged. The script fails closed if the generated schema structure or reference form changes.

`contract-metadata.json` mechanically retains operation mappings, OpenAPI schema constraints, formats, nullable/closed-object markers, and every `x-*` extension by JSON Pointer. It is a generated sidecar for information TypeScript cannot express, not a second API contract.

From the combined cutover worktree root, regenerate with:

```sh
python3 frontend/scripts/generate-device-metadata-client.py \
  --spec backend/docs/initiatives/device-metadata-native-cutover/openapi.yaml \
  --out frontend/src/service/api/generated/device-metadata
```

The generator checks OpenAPI 3.2.1 and requires a non-empty set of operations with unique `operationId` values; the manifest records the current operation count. It does not modify the source spec. Python 3, PyYAML, npm/npx, and network access on first use are required; npx fetches the exact generator version without installing the frontend dependency tree. `manifest.json` records source and output SHA-256 values and the compatibility transform version/schema.
