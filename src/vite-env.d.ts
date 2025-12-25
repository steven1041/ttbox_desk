/// <reference types="vite/client" />

// Tauri API 类型定义
interface Window {
  __TAURI__?: any;
  __TAURI_API__?: any;
}
