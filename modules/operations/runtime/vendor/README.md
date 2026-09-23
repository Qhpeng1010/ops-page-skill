# Shared local platform bundle

`ops-platform.js` / `ops-platform.css` are compiled from the same `modules/operations/shell/` sources and the locked React / Ant Design dependencies used by React mode. This directory is shipped with the skill. No CDN, package installation or compilation is needed for ordinary spec pages.

Do not edit generated assets. For platform or dependency maintenance, use `node scripts/build-spec-runtime.mjs --dependencies <prepared-project-or-cache>`, then run `node --test scripts/test-generation.mjs scripts/test-spec-runtime.mjs` and `node scripts/check-skill.mjs`. The build never installs dependencies.

`manifest.json` records component inputs, locked versions and SHA-256 digests. Generation rejects stale or modified bundles before replacing a preview. Platform configuration is injected separately for every Change; changing theme values does not require recompilation. Only business layout belongs in `ops-page-spec.css`; never add another sidebar, header, tabs or query layout there.
