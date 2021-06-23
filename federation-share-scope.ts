import type { Plugin } from "esbuild";

import type { ModuleFederationConfig } from "./utils";
import { normalizeShared } from "./utils";

export type { ModuleFederationConfig };

export function federationShareScopePlugin(
  rootDirectory: string,
  moduleFederationConfig: ModuleFederationConfig
): Plugin {
  let moduleFederation = moduleFederationConfig || {};
  let shared = normalizeShared(moduleFederation.shared);

  const shareScopesMeta = `{
  ${
    Object.entries(shared)
      ?.map(
        ([shared, sharedConfig]) => `${JSON.stringify(shared)}: {
    import: () => import(${JSON.stringify(shared)}),
    shareKey: ${JSON.stringify(sharedConfig.shareKey)},
    shareScope: ${JSON.stringify(sharedConfig.shareScope)},
    version: ${JSON.stringify(sharedConfig.version)}
  }`
      )
      .join(",\n  ") || ""
  }
}`;

  return {
    name: "federation share scope",
    setup(build) {
      build.onResolve({ filter: /^@runtime\/federation$/ }, (args) => {
        return { path: args.path, namespace: "module-federation" };
      });

      build.onLoad(
        { filter: /^@runtime\/federation$/, namespace: "module-federation" },
        (args) => {
          let contents = `
const shareScopesMeta = ${shareScopesMeta};

export const shareScopes = {};

const shareScopePromises = {};
export const initSharing = (scope) => {
  if (shareScopePromises[scope]) {
    return shareScopePromises[scope];
  }

  let shareScope = {};
  
  shareScopePromises[scope] = Promise.all(Object.keys(shareScopesMeta).map(async shared => {
    let meta = shareScopesMeta[shared];
    if (meta.shareScope.includes(scope)) {
      shareScope[meta.shareKey] = {
        [meta.version]: {
          loaded: true,
          get: () => meta.import().then(m => () => m.default || m),
          from: "@runtime/remix",
        }
      };
    }
  })).then(() => {
    shareScopes[scope] = shareScope;
  });

  return shareScopePromises[scope];
};
`;

          return {
            resolveDir: rootDirectory,
            loader: "js",
            contents,
          };
        }
      );
    },
  };
}
