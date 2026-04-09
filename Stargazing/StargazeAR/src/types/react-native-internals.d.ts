declare module '@react-native/assets-registry/registry' {
  export type PackagerAsset = {
    __packager_asset?: boolean;
    httpServerLocation: string;
    name: string;
    hash: string;
    type: string;
    scales: number[];
    width?: number;
    height?: number;
    fileHashes?: string[];
    fileUris?: string[];
  };

  export function getAssetByID(
    assetId: number,
  ): PackagerAsset | undefined;
}

declare module 'react-native/Libraries/Image/AssetSourceResolver' {
  export default class AssetSourceResolver {
    asset: unknown;

    constructor(
      serverUrl: string | null | undefined,
      jsbundleUrl: string | null | undefined,
      asset: unknown,
    );

    defaultAsset(): unknown;
    fromSource(source: string): unknown;
    resourceIdentifierWithoutScale(): unknown;

    static pickScale(scales: number[], deviceScale: number): number;
  }
}

declare module 'invariant' {
  export default function invariant(
    condition: unknown,
    format?: string,
    ...args: unknown[]
  ): asserts condition;
}
