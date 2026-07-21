/**
 * 主题状态管理
 *
 * 设计要点：
 * - `applyTheme(t)`：仅写 DOM (data-theme attribute) + localStorage + 内部 state，不触发服务端写。
 *   供 configStore 在 loadConfig/updateConfig 等同步流程中使用，避免循环更新。
 * - `setTheme(t)`：applyTheme + 服务端持久化（updateConfigPatch）。
 *   供 UI 主动切换（设置面板、ThemeSwitcher 按钮）调用。
 * - 启动时从 localStorage 读取初值；main.tsx 已在 React render 之前同步写 data-theme 防 FOUC。
 *
 * 背景系统：
 * - `applyBackground(config)`：仅写 DOM + localStorage + 内部 state。
 * - `setBackground(config)`：applyBackground + 服务端持久化。
 * - localStorage key: 'bg-config'，存储 BackgroundConfig JSON。
 */

import { create } from 'zustand';
import { createLogger } from '@/utils/logger';

const log = createLogger('ThemeStore');

export type Theme = 'dark' | 'light';
export type BackgroundMode = 'solid' | 'gradient' | 'aurora' | 'image';

export interface BackgroundConfig {
  mode: BackgroundMode;
  /** 图片背景的 data URL（base64） */
  imageUrl?: string;
  /** 背景遮罩透明度 0-100 */
  opacity?: number;
  /** 背景模糊度 0-20 (px) */
  blur?: number;
}

const STORAGE_KEY = 'theme';
const BG_STORAGE_KEY = 'bg-config';
const BG_STORAGE_KEY_OLD = 'bg-mode';
const DEFAULT_THEME: Theme = 'dark';
const DEFAULT_BACKGROUND: BackgroundConfig = { mode: 'solid', opacity: 55, blur: 0 };

interface ThemeState {
  /** 当前主题 */
  theme: Theme;
  /** 背景配置 */
  background: BackgroundConfig;
  /** 应用主题：写 DOM + localStorage + 内部 state；不触发服务端写 */
  applyTheme: (theme: Theme) => void;
  /** 用户主动切换：applyTheme + 服务端持久化 */
  setTheme: (theme: Theme) => Promise<void>;
  /** 应用背景配置：写 DOM + localStorage + 内部 state；不触发服务端写 */
  applyBackground: (config: BackgroundConfig) => void;
  /** 用户主动切换背景：applyBackground + 服务端持久化 */
  setBackground: (config: BackgroundConfig) => Promise<void>;
  /** 快捷方法：仅切换模式 */
  setBackgroundMode: (mode: BackgroundMode) => Promise<void>;
  /** 快捷方法：设置图片（自动切到 image 模式） */
  setImageUrl: (url: string) => Promise<void>;
  /** 快捷方法：设置透明度 */
  setOpacity: (opacity: number) => Promise<void>;
  /** 快捷方法：设置模糊度 */
  setBlur: (blur: number) => Promise<void>;
}

function readInitialTheme(): Theme {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'light' ? 'light' : 'dark';
}

function readInitialBackground(): BackgroundConfig {
  if (typeof window === 'undefined') return DEFAULT_BACKGROUND;
  try {
    const stored = window.localStorage.getItem(BG_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as BackgroundConfig;
      if (parsed.mode === 'solid' || parsed.mode === 'gradient' || parsed.mode === 'aurora' || parsed.mode === 'image') {
        return {
          mode: parsed.mode,
          imageUrl: parsed.imageUrl,
          opacity: parsed.opacity ?? 55,
          blur: parsed.blur ?? 0,
        };
      }
    }
  } catch {
    // JSON 解析失败，尝试旧格式
  }
  // 兼容旧版 bg-mode 字符串格式
  const oldStored = window.localStorage.getItem(BG_STORAGE_KEY_OLD);
  if (oldStored === 'gradient' || oldStored === 'aurora') {
    return { mode: oldStored, opacity: 55, blur: 0 };
  }
  return DEFAULT_BACKGROUND;
}

function writeDom(theme: Theme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
}

function writeStorage(theme: Theme): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch (e) {
    log.warn('Failed to persist theme to localStorage', { error: e instanceof Error ? e.message : String(e) });
  }
}

function writeBgDom(config: BackgroundConfig): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (config.mode === 'solid') {
    root.removeAttribute('data-bg-mode');
  } else {
    root.setAttribute('data-bg-mode', config.mode);
  }
  // 设置 CSS 变量
  if (config.imageUrl) {
    root.style.setProperty('--bg-image', `url('${config.imageUrl}')`);
  } else {
    root.style.removeProperty('--bg-image');
  }
  root.style.setProperty('--bg-image-opacity', `${(config.opacity ?? 55) / 100}`);
  root.style.setProperty('--bg-blur', `${config.blur ?? 0}px`);
}

function writeBgStorage(config: BackgroundConfig): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(BG_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    log.warn('Failed to persist background config to localStorage', { error: e instanceof Error ? e.message : String(e) });
  }
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: readInitialTheme(),
  background: readInitialBackground(),

  applyTheme: (theme) => {
    if (get().theme === theme) {
      writeDom(theme);
      return;
    }
    writeDom(theme);
    writeStorage(theme);
    set({ theme });
  },

  setTheme: async (theme) => {
    writeDom(theme);
    writeStorage(theme);
    set({ theme });
    try {
      const { useConfigStore } = await import('./configStore');
      await useConfigStore.getState().updateConfigPatch({ theme });
    } catch (e) {
      log.error(
        'Failed to persist theme to server config',
        e instanceof Error ? e : new Error(String(e))
      );
    }
  },

  applyBackground: (config) => {
    writeBgDom(config);
    writeBgStorage(config);
    set({ background: config });
  },

  setBackground: async (config) => {
    writeBgDom(config);
    writeBgStorage(config);
    set({ background: config });
    try {
      const { useConfigStore } = await import('./configStore');
      await useConfigStore.getState().updateConfigPatch({ background: config } as any);
    } catch (e) {
      log.error(
        'Failed to persist background config to server config',
        e instanceof Error ? e : new Error(String(e))
      );
    }
  },

  setBackgroundMode: async (mode) => {
    const current = get().background;
    const newConfig: BackgroundConfig = {
      ...current,
      mode,
      // 切到非 image 模式时清除图片数据以节省空间
      imageUrl: mode === 'image' ? current.imageUrl : undefined,
    };
    await get().setBackground(newConfig);
  },

  setImageUrl: async (url) => {
    const current = get().background;
    await get().setBackground({ ...current, mode: 'image', imageUrl: url });
  },

  setOpacity: async (opacity) => {
    const current = get().background;
    await get().setBackground({ ...current, opacity });
  },

  setBlur: async (blur) => {
    const current = get().background;
    await get().setBackground({ ...current, blur });
  },
}));
