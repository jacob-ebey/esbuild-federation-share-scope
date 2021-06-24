# esbuild-federation-share-scope

Enables federation share scope for interop with Webpack 5 Module Federation containers. A full example can be found here: https://github.com/jacob-ebey/esbuild-federation-example.

## Usage

Bundler configuration:

```js
esbuild.build({
  // ... your usual config
  plugins: [
    federationShareScopePlugin(process.cwd(), {
      shared: ["react"],
      // OR:
      // shared: {
      //   "react": {
      //     shareKey: "react",
      //     shareScope: ["default"],
      //     version: "17.0.0"
      //   }
      // }
    }),
  ],
});
```

Access to share scope:

```js
// Effectively __webpack_init_sharing__, __webpack_share_scopes__ respectively
import { initSharing, shareScopes } from "@runtime/federation";

// external webpack built federation container
const container = window[remote];

// initialize share scope
initSharing("default")
  // initialize the container
  .then(() => container.init(shareScopes[shareScope]))
  // get an exposed module
  .then(() => container.get("./exposed"))
  // run the module factory to get the module value
  .then(factory => factory())
```
