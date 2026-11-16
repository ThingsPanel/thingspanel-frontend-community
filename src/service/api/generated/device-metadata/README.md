# Device Metadata generated contract

`types.ts` is generated from the authoritative `backend/docs/initiatives/device-metadata-native-cutover/openapi.yaml` with `openapi-typescript@7.13.0`. The generation script mechanically lifts the complete generated `NativeThingModelJsonValue` recursive union expression into a top-level named alias (`recursive-schema-alias-v1`) because TypeScript rejects the generator's recursive reference through `components["schemas"]` (TS2502). It replaces only those self-reference tokens; the union members and wire shape remain unchanged. The script fails closed if the generated schema structure or reference form changes.

`contract-metadata.json` mechanically retains operation mappings, OpenAPI schema constraints, formats, nullable/closed-object markers, and every `x-*` extension by JSON Pointer. It is a generated sidecar for information TypeScript cannot express, not a second API contract.

Normal builds consume checked-in files. Regenerate with locked dependencies installed:

```sh
pnpm install --frozen-lockfile
node scripts/generate-device-contract.mjs --source <backend-checkout>/docs/initiatives/device-metadata-native-cutover/openapi.yaml
```

The explicit source path supports any checkout. Commit all three generated files together; hashes are computed from their exact bytes.

The checked-in manifest records the historical OpenAPI version, operation count, source/output SHA-256 values, and recursive schema transform version. The generator records actual input and output hashes. The portable source identifier is relative to the named backend repository; it is not a local filesystem path.
