/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NASA_API_KEY: string
  readonly VITE_NASA_NEO_BASE_URL: string
  readonly VITE_NASA_SBDB_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
