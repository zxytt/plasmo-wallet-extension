/**
 * Button 组件 -
 * 支持多种变体、尺寸和状态，包含按压动画和悬停效果
 */
import React from "react"

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  className?: string
  fullWidth?: boolean
  type?: 'button' | 'submit' | 'reset'
}

export function Button({ 
  children, 
  onClick, 
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  fullWidth = false,
  type = 'button'
}: ButtonProps) {
  // 基础样式类
  const baseClasses = [
    "btn",
    "relative",
    "inline-flex",
    "items-center", 
    "justify-center",
    "font-medium",
    "border",
    "rounded-lg",
    "transition-all",
    "duration-150",
    "ease-in-out",
    "focus:outline-none",
    "focus:ring-2",
    "focus:ring-offset-2",
    "active:scale-[0.98]", // 按压动画
    "disabled:opacity-50",
    "disabled:cursor-not-allowed",
    "disabled:active:scale-100" // 禁用状态下不缩放
  ].join(" ")
  
  // 尺寸样式
  const sizeClasses = {
    sm: "h-8 px-3 text-sm min-w-[64px]",
    md: "h-10 px-4 text-sm min-w-[80px]", 
    lg: "h-12 px-6 text-base min-w-[96px]"
  }
  
  // 变体样式
  const variantClasses = {
    primary: [
      "bg-blue-600",
      "text-white", 
      "border-blue-600",
      "shadow-sm",
      "hover:bg-blue-700",
      "hover:border-blue-700",
      "hover:shadow-md",
      "focus:ring-blue-500",
      "active:bg-blue-800"
    ].join(" "),
    
    secondary: [
      "bg-white",
      "text-gray-700",
      "border-gray-300",
      "shadow-sm",
      "hover:bg-gray-50",
      "hover:border-gray-400",
      "hover:text-gray-900",
      "focus:ring-gray-500",
      "active:bg-gray-100"
    ].join(" "),
    
    ghost: [
      "bg-transparent",
      "text-gray-600",
      "border-transparent",
      "hover:bg-gray-100",
      "hover:text-gray-900",
      "focus:ring-gray-500",
      "active:bg-gray-200"
    ].join(" "),
    
    danger: [
      "bg-red-600",
      "text-white",
      "border-red-600", 
      "shadow-sm",
      "hover:bg-red-700",
      "hover:border-red-700",
      "hover:shadow-md",
      "focus:ring-red-500",
      "active:bg-red-800"
    ].join(" ")
  }

  // 宽度样式
  const widthClass = fullWidth ? "w-full" : ""

  // 加载状态下的内容
  const loadingSpinner = (
    <svg 
      className="animate-spin -ml-1 mr-2 h-4 w-4" 
      fill="none" 
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${className}`}
      aria-disabled={disabled || loading}
    >
      {loading && loadingSpinner}
      <span className={loading ? "opacity-75" : ""}>{children}</span>
    </button>
  )
}