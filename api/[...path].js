// Plain JavaScript on purpose: the platform runs its own TypeScript pass over `api/`,
// and this file must stay a thin re-export of the bundle the build produces. The
// explicit `.js` extension is required - Node's ESM resolver does not guess it.
export { default } from "../dist/serverless.js";
