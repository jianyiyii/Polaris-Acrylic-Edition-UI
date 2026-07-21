import React from "react";
import ReactDOM from "react-dom/client";
import * as ReactJSXRuntime from "react/jsx-runtime";
import App from "./App";
import MobileApp from "./mobile/MobileApp";
import { MobileConnectionGate } from "./mobile/MobileConnectionGate";
import { isMobileTauriRuntime, shouldRenderMobileApp } from "./mobile/platform";
import "./i18n";

// 暴露宿主 React 给外部插件面板使用
;(window as any).__POLARIS_HOST_REACT__ = React;
;(window as any).__POLARIS_HOST_REACT_JSX__ = ReactJSXRuntime;

// 主题预设：在 React render 之前同步读取 localStorage 并写入 data-theme，防止首屏闪烁（FOUC）
(() => {
  try {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('theme') : null;
    const theme = stored === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  } catch {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();

// 背景模式预设：同步读取 localStorage 并写入 data-bg-mode，防止首屏闪烁
(() => {
  try {
    const bgConfig = typeof window !== 'undefined' ? window.localStorage.getItem('bg-config') : null;
    if (bgConfig) {
      const parsed = JSON.parse(bgConfig);
      if (parsed.mode && parsed.mode !== 'solid') {
        document.documentElement.setAttribute('data-bg-mode', parsed.mode);
      }
      if (parsed.imageUrl) {
        document.documentElement.style.setProperty('--bg-image', `url('${parsed.imageUrl}')`);
      }
      if (parsed.opacity !== undefined) {
        document.documentElement.style.setProperty('--bg-image-opacity', `${parsed.opacity / 100}`);
      }
      if (parsed.blur !== undefined) {
        document.documentElement.style.setProperty('--bg-blur', `${parsed.blur}px`);
      }
    } else {
      // 兼容旧版 bg-mode 字符串格式
      const oldMode = typeof window !== 'undefined' ? window.localStorage.getItem('bg-mode') : null;
      if (oldMode && oldMode !== 'solid') {
        document.documentElement.setAttribute('data-bg-mode', oldMode);
      }
    }
  } catch {
    // 忽略，使用默认纯色背景
  }
})();

const root = document.getElementById("root") as HTMLElement;

/**
 * 根组件选择：
 * - ?mobile=1：旧 MobileApp companion（调试）
 * - 移动端 Tauri APK：完整 Web App + 连接配置 Gate（无 serverUrl 时先配地址/Token）
 * - 其它（桌面 / 手机浏览器访问 polaris-web）：完整 Web App
 */
function RootApp() {
  if (shouldRenderMobileApp()) {
    return <MobileApp />;
  }

  if (isMobileTauriRuntime()) {
    return (
      <MobileConnectionGate>
        {() => <App />}
      </MobileConnectionGate>
    );
  }

  return <App />;
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>,
);
