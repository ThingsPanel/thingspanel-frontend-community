# Device Metadata generated contract

`types.ts` is generated from the authoritative `backend/docs/initiatives/device-metadata-native-cutover/openapi.yaml` with `openapi-typescript@7.13.0`. The generation script mechanically lifts the complete generated `NativeThingModelJsonValue` recursive union expression into a top-level named alias (`recursive-schema-alias-v1`) because TypeScript rejects the generator's recursive reference through `components["schemas"]` (TS2502). It replaces only those self-reference tokens; the union members and wire shape remain unchanged. The script fails closed if the generated schema structure or reference form changes.

`contract-metadata.json` mechanically retains operation mappings, OpenAPI schema constraints, formats, nullable/closed-object markers, and every `x-*` extension by JSON Pointer. It is a generated sidecar for information TypeScript cannot express, not a second API contract.

The original generation helper is not included in this repository. Do not use the old worktree-specific command as a reproducible build step. Normal frontend builds consume the checked-in generated files. Regeneration requires restoring and verifying the helper before changing this contract.

The checked-in manifest records the historical OpenAPI version, operation count, source/output SHA-256 values, and recursive schema transform version. These are provenance metadata, not evidence of a currently runnable generation command. The portable source identifier is relative to the named backend repository; it is not a local filesystem path.
