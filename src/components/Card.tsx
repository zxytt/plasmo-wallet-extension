/**
 * Card 组件 - MetaMask 风格的卡片容器组件
 * 支持不同的内边距、阴影选项、边框和圆角样式
 */
import React from 'react'

interface CardProps {
  children: React.ReactNode
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  border?: boolean | 'light' | 'medium' | 'strong'
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  hover?: boolean
  className?: string
  onClick?: () => void
  as?: 'div' | 'section' | 'article' | 'aside'
  background?: 'white' | 'gray' | 'transparent'
}

export function Card({
  children,
  padding = 'md',
  shadow = 'sm',
  border = true,
  rounded = 'lg',
  hover = false,
  className = '',
  onClick,
  as: Component = 'div',
  background = 'white'
}: CardProps) {
  // 基础样式类
  const baseClasses = [
    "card",
    "transition-all",
    "duration-200",
    "ease-in-out"
  ].join(" ")

  // 内边距样式
  const paddingClasses = {
    none: "p-0",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
    xl: "p-8"
  }

  // 阴影样式
  const shadowClasses = {
    none: "shadow-none",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl"
  }

  // 边框样式
  const getBorderClass = () => {
    if (border === false) return "border-0"
    if (border === true || border === 'light') return "border border-gray-200"
    if (border === 'medium') return "border border-gray-300"
    if (border === 'strong') return "border border-gray-400"
    return "border-0"
  }

  // 圆角样式
  const roundedClasses = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    '2xl': "rounded-2xl",
    full: "rounded-full"
  }

  // 背景样式
  const backgroundClasses = {
    white: "bg-white",
    gray: "bg-gray-50",
    transparent: "bg-transparent"
  }

  // 悬停效果
  const hoverClasses = hover ? [
    "hover:shadow-lg",
    "hover:-translate-y-1",
    "cursor-pointer"
  ].join(" ") : ""

  // 点击效果
  const clickableClasses = onClick ? [
    "cursor-pointer",
    "active:scale-[0.99]"
  ].join(" ") : ""

  const allClasses = [
    baseClasses,
    paddingClasses[padding],
    shadowClasses[shadow],
    getBorderClass(),
    roundedClasses[rounded],
    backgroundClasses[background],
    hoverClasses,
    clickableClasses,
    className
  ].filter(Boolean).join(" ")

  return (
    <Component
      className={allClasses}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      } : undefined}
    >
      {children}
    </Component>
  )
}

// Card 子组件
interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`card-header border-b border-gray-200 pb-4 mb-4 ${className}`}>
      {children}
    </div>
  )
}

interface CardBodyProps {
  children: React.ReactNode
  className?: string
}

export function CardBody({ children, className = '' }: CardBodyProps) {
  return (
    <div className={`card-body ${className}`}>
      {children}
    </div>
  )
}

interface CardFooterProps {
  children: React.ReactNode
  className?: string
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`card-footer border-t border-gray-200 pt-4 mt-4 ${className}`}>
      {children}
    </div>
  )
}

interface CardTitleProps {
  children: React.ReactNode
  level?: 1 | 2 | 3 | 4 | 5 | 6
  className?: string
}

export function CardTitle({ children, level = 3, className = '' }: CardTitleProps) {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements
  
  const sizeClasses = {
    1: "text-3xl font-bold",
    2: "text-2xl font-bold", 
    3: "text-xl font-semibold",
    4: "text-lg font-semibold",
    5: "text-base font-medium",
    6: "text-sm font-medium"
  }

  return (
    <Tag className={`card-title text-gray-900 ${sizeClasses[level]} ${className}`}>
      {children}
    </Tag>
  )
}

interface CardDescriptionProps {
  children: React.ReactNode
  className?: string
}

export function CardDescription({ children, className = '' }: CardDescriptionProps) {
  return (
    <p className={`card-description text-gray-600 text-sm leading-relaxed ${className}`}>
      {children}
    </p>
  )
}