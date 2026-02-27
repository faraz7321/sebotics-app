interface ImportMetaEnv {
  readonly VITE_PUBLIC_API_URL?: string;
  readonly VITE_PUBLIC_WS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  __APP_CONFIG__?: {
    API_BASE_URL?: string;
  };
}
