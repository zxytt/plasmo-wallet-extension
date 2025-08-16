/**
 * Icon 组件系统 - MetaMask 风格的图标组件
 * 支持统一的图标尺寸和颜色系统，包含常用图标
 */
import React from 'react'

// 图标名称类型
export type IconName = 
  | 'settings'
  | 'copy'
  | 'eye'
  | 'eye-off'
  | 'network'
  | 'wallet'
  | 'send'
  | 'receive'
  | 'swap'
  | 'history'
  | 'lock'
  | 'unlock'
  | 'check'
  | 'close'
  | 'arrow-left'
  | 'arrow-right'
  | 'arrow-up'
  | 'arrow-down'
  | 'plus'
  | 'minus'
  | 'info'
  | 'warning'
  | 'error'
  | 'success'
  | 'loading'
  | 'search'
  | 'menu'
  | 'more'
  | 'external-link'
  | 'qr-code'
  | 'gas'
  | 'ethereum'

// 图标尺寸类型
export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

// 图标颜色类型
export type IconColor = 
  | 'current'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'gray'
  | 'white'
  | 'black'

interface IconProps {
  name: IconName
  size?: IconSize
  color?: IconColor
  className?: string
  onClick?: () => void
  'aria-label'?: string
}

// 图标尺寸映射
const sizeClasses: Record<IconSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
  '2xl': 'w-10 h-10'
}

// 图标颜色映射
const colorClasses: Record<IconColor, string> = {
  current: 'text-current',
  primary: 'text-blue-600',
  secondary: 'text-gray-600',
  success: 'text-green-600',
  warning: 'text-yellow-600',
  error: 'text-red-600',
  info: 'text-blue-500',
  gray: 'text-gray-500',
  white: 'text-white',
  black: 'text-black'
}

// SVG 图标路径定义
const iconPaths: Record<IconName, React.ReactNode> = {
  settings: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  ),
  copy: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
    />
  ),
  eye: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  ),
  'eye-off': (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
    />
  ),
  network: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
    />
  ),
  wallet: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
    />
  ),
  send: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
    />
  ),
  receive: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M7 16l-4-4m0 0l4-4m-4 4h18"
    />
  ),
  swap: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
    />
  ),
  history: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  ),
  lock: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
    />
  ),
  unlock: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
    />
  ),
  check: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 13l4 4L19 7"
    />
  ),
  close: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  ),
  'arrow-left': (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 19l-7-7 7-7"
    />
  ),
  'arrow-right': (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5l7 7-7 7"
    />
  ),
  'arrow-up': (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 15l7-7 7 7"
    />
  ),
  'arrow-down': (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 9l-7 7-7-7"
    />
  ),
  plus: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
    />
  ),
  minus: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M20 12H4"
    />
  ),
  info: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  ),
  warning: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    />
  ),
  error: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  ),
  success: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  ),
  loading: (
    <>
      <path
        className="opacity-25"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </>
  ),
  search: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  ),
  menu: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6h16M4 12h16M4 18h16"
    />
  ),
  more: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
    />
  ),
  'external-link': (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
    />
  ),
  'qr-code': (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
    />
  ),
  gas: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z M9.879 16.121A3 3 0 1012.015 11L11 14l4 4-6.121-1.879z"
    />
  ),
  ethereum: (
    <g fill="currentColor">
      <path d="M12 1.75l-6.25 10.5L12 16l6.25-3.75L12 1.75z" />
      <path d="M12 17.25l-6.25-9.5L12 22.25l6.25-14L12 17.25z" />
    </g>
  )
}

export function Icon({
  name,
  size = 'md',
  color = 'current',
  className = '',
  onClick,
  'aria-label': ariaLabel,
  ...props
}: IconProps) {
  const baseClasses = [
    'icon',
    'inline-block',
    'flex-shrink-0',
    sizeClasses[size],
    colorClasses[color]
  ].join(' ')

  const clickableClasses = onClick ? [
    'cursor-pointer',
    'transition-colors',
    'duration-150',
    'hover:opacity-75'
  ].join(' ') : ''

  const allClasses = [baseClasses, clickableClasses, className]
    .filter(Boolean)
    .join(' ')

  // 特殊处理加载图标的动画
  const isLoading = name === 'loading'
  const animationClass = isLoading ? 'animate-spin' : ''

  return (
    <svg
      className={`${allClasses} ${animationClass}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      onClick={onClick}
      role={onClick ? 'button' : 'img'}
      aria-label={ariaLabel || name}
      {...props}
    >
      {iconPaths[name]}
    </svg>
  )
}

// 预定义的图标组合组件
export function SettingsIcon(props: Omit<IconProps, 'name'>) {
  return <Icon name="settings" {...props} />
}

export function CopyIcon(props: Omit<IconProps, 'name'>) {
  return <Icon name="copy" {...props} />
}

export function EyeIcon(props: Omit<IconProps, 'name'>) {
  return <Icon name="eye" {...props} />
}

export function EyeOffIcon(props: Omit<IconProps, 'name'>) {
  return <Icon name="eye-off" {...props} />
}

export function NetworkIcon(props: Omit<IconProps, 'name'>) {
  return <Icon name="network" {...props} />
}

export function WalletIcon(props: Omit<IconProps, 'name'>) {
  return <Icon name="wallet" {...props} />
}

export function SendIcon(props: Omit<IconProps, 'name'>) {
  return <Icon name="send" {...props} />
}

export function ReceiveIcon(props: Omit<IconProps, 'name'>) {
  return <Icon name="receive" {...props} />
}

export function LoadingIcon(props: Omit<IconProps, 'name'>) {
  return <Icon name="loading" {...props} />
}