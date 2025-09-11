/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly DFX_NETWORK: string;
  readonly CANISTER_ID_BACKEND: string;
  readonly CANISTER_ID_FRONTEND: string;
  readonly CANISTER_ID_INTERNET_IDENTITY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}