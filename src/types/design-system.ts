/**
 * 设计系统类型定义
 * 为设计令牌和组件提供类型安全
 */

// 主题类型
export type Theme = 'light' | 'dark' | 'system'

// 颜色类型
export type ColorScale = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900

export type ColorPalette = 'primary' | 'gray' | 'success' | 'error' | 'warning' | 'info'

export type SemanticColor = 'success' | 'error' | 'warning' | 'info'

// 间距类型
export type Spacing = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20

// 圆角类型
export type BorderRadius = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'

// 阴影类型
export type Shadow = 'sm' | 'md' | 'lg' | 'xl' | 'inner'

// 字体大小类型
export type FontSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'

// 字体粗细类型
export type FontWeight = 'light' | 'normal' | 'medium' | 'semibold' | 'bold'

// 行高类型
export type LineHeight = 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose'

// 过渡类型
export type Transition = 'fast' | 'normal' | 'slow'

// 组件尺寸类型
export type ComponentSize = 'sm' | 'md' | 'lg'

// 按钮变体类型
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'

// 徽章变体类型
export type BadgeVariant = 'success' | 'error' | 'warning' | 'info'

// Z-index层级类型
export type ZIndex = 'dropdown' | 'sticky' | 'fixed' | 'modal-backdrop' | 'modal' | 'popover' | 'tooltip'

// 设计令牌接口
export interface DesignTokens {
  colors: {
    primary: Record<ColorScale, string>
    gray: Record<ColorScale, string>
    semantic: Record<SemanticColor, string>
    metamask: {
      orange: string
      blue: string
      purple: string
    }
  }
  spacing: Record<Spacing, string>
  borderRadius: Record<BorderRadius, string>
  shadows: Record<Shadow, string>
  typography: {
    fontFamily: {
      sans: string
      mono: string
    }
    fontSize: Record<FontSize, string>
    fontWeight: Record<FontWeight, number>
    lineHeight: Record<LineHeight, number>
  }
  transitions: Record<Transition, string>
  zIndex: Record<ZIndex, number>
}

// 主题配置接口
export interface ThemeConfig {
  theme: Theme
  systemTheme: 'light' | 'dark'
  appliedTheme: 'light' | 'dark'
}

// 组件属性接口
export interface ComponentProps {
  className?: string
  children?: React.ReactNode
}

export interface ButtonProps extends ComponentProps {
  variant?: ButtonVariant
  size?: ComponentSize
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  onClick?: () => void
}

export interface BadgeProps extends ComponentProps {
  variant?: BadgeVariant
  size?: ComponentSize
}

export interface CardProps extends ComponentProps {
  padding?: Spacing
  shadow?: Shadow
  hover?: boolean
}

export interface InputProps extends ComponentProps {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  error?: boolean
  helperText?: string
}

// 响应式断点类型
export type Breakpoint = 'sm' | 'md' | 'lg'

export interface ResponsiveValue<T> {
  base?: T
  sm?: T
  md?: T
  lg?: T
}

// 动画类型
export type Animation = 'fadeIn' | 'slideUp' | 'pulse' | 'spin'

// 工具函数类型
export type ThemeFunction = (theme: Theme) => void
export type TokenFunction = (token: string) => string