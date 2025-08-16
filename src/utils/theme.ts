/**
 * 主题管理工具
 * 支持明暗模式切换和系统偏好设置检测
 */

export type Theme = 'light' | 'dark' | 'system'

const THEME_STORAGE_KEY = 'wallet-theme'

/**
 * 获取当前主题设置
 */
export function getTheme(): Theme {
  if (typeof window === 'undefined') return 'system'
  
  const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme
  return stored || 'system'
}

/**
 * 获取系统偏好的主题
 */
export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * 获取实际应用的主题
 */
export function getAppliedTheme(): 'light' | 'dark' {
  const theme = getTheme()
  return theme === 'system' ? getSystemTheme() : theme
}

/**
 * 设置主题
 */
export function setTheme(theme: Theme) {
  if (typeof window === 'undefined') return
  
  localStorage.setItem(THEME_STORAGE_KEY, theme)
  applyTheme(theme)
}

/**
 * 应用主题到DOM
 */
export function applyTheme(theme: Theme) {
  if (typeof window === 'undefined') return
  
  const root = document.documentElement
  const appliedTheme = theme === 'system' ? getSystemTheme() : theme
  
  // 移除之前的主题属性
  root.removeAttribute('data-theme')
  
  // 应用新主题
  if (appliedTheme === 'dark') {
    root.setAttribute('data-theme', 'dark')
  }
}

/**
 * 切换主题
 */
export function toggleTheme() {
  const currentTheme = getTheme()
  const appliedTheme = getAppliedTheme()
  
  // 如果当前是系统模式，切换到相反的固定模式
  if (currentTheme === 'system') {
    setTheme(appliedTheme === 'dark' ? 'light' : 'dark')
  } else {
    // 如果是固定模式，切换到另一个固定模式
    setTheme(currentTheme === 'dark' ? 'light' : 'dark')
  }
}

/**
 * 初始化主题系统
 */
export function initTheme() {
  if (typeof window === 'undefined') return
  
  // 应用保存的主题
  applyTheme(getTheme())
  
  // 监听系统主题变化
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const handleChange = () => {
    if (getTheme() === 'system') {
      applyTheme('system')
    }
  }
  
  mediaQuery.addEventListener('change', handleChange)
  
  // 返回清理函数
  return () => {
    mediaQuery.removeEventListener('change', handleChange)
  }
}

/**
 * 获取主题显示名称
 */
export function getThemeDisplayName(theme: Theme): string {
  const names = {
    light: '浅色模式',
    dark: '深色模式',
    system: '跟随系统'
  }
  return names[theme]
}