export interface ModuleFederationSharedConfig {
  shareKey?: string;
  shareScope?: string | string[];
  version?: string;
}

export interface ModuleFederationConfig {
  shared?: string[] | { [dep: string]: ModuleFederationSharedConfig };
}

function getVersion(shared: string) {
  return require(require.resolve(`${shared}/package.json`)).version as string;
}

type NormalizedShared = {
  [key: string]: { shareKey: string; shareScope: string[]; version: string };
};

export function normalizeShared(
  shared: ModuleFederationConfig["shared"]
): NormalizedShared {
  shared = shared || [];

  if (Array.isArray(shared)) {
    return shared.reduce<NormalizedShared>((p, shared) => {
      return {
        ...p,
        [shared]: {
          shareKey: shared,
          shareScope: ["default"],
          version: getVersion(shared),
        },
      };
    }, {});
  }

  return Object.entries(shared).reduce<NormalizedShared>(
    (p, [shared, sharedConfig]) => {
      let shareScope = ["default"];
      if (Array.isArray(sharedConfig.shareScope)) {
        shareScope = sharedConfig.shareScope;
      } else if (typeof sharedConfig.shareScope === "string") {
        shareScope = [sharedConfig.shareScope];
      }

      return {
        ...p,
        [shared]: {
          shareKey: sharedConfig.shareKey || shared,
          shareScope,
          version: sharedConfig.version || getVersion(shared),
        },
      };
    },
    {}
  );
}
