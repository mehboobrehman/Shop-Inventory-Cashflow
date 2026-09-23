/// <reference types="vite/client" />

declare const __APP_VERSION__: string;
declare const __GIT_COMMIT_HASH__: string;
declare const __BUILD_TIMESTAMP__: string;
declare const __ENVIRONMENT__: string;

interface ImportMetaEnv {
  readonly VITE_APP_VERSION?: string;
  readonly VITE_GIT_COMMIT_HASH?: string;
  readonly VITE_BUILD_TIMESTAMP?: string;
  readonly VITE_ENVIRONMENT?: string;
  readonly [key: string]: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
