/**
 * 设计令牌工具函数
 * 提供便捷的API来使用设计令牌
 */

/**
 * 生成CSS变量名
 */
export function cssVar(token: string): string {
  return `var(--${token})`
}

/**
 * 生成颜色CSS变量
 */
export function colorVar(palette: string, scale: number): string {
  return cssVar(`color-${palette}-${scale}`)
}

/**
 * 生成间距CSS变量
 */
export function spacingVar(size: number): string {
  return cssVar(`spacing-${size}`)
}

/**
 * 生成主题CSS变量
 */
export function themeVar(property: string): string {
  return cssVar(`theme-${property}`)
}

/**
 * 组合多个CSS类名
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * 检查是否为深色主题
 */
export function isDarkTheme(): boolean {
  if (typeof window === 'undefined') return false
  
  const root = document.documentElement
  return root.getAttribute('data-theme') === 'dark' ||
    (!root.hasAttribute('data-theme') && 
     window.matchMedia('(prefers-color-scheme: dark)').matches)
}

/**
 * 获取CSS变量值
 */
export function getCSSVariable(name: string): string {
  if (typeof window === 'undefined') return ''
  
  const styles = window.getComputedStyle(document.documentElement)
  return styles.getPropertyValue(`--${name}`)
}