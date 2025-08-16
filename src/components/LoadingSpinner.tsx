import React from "react"

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  text?: string
  className?: string
}

export function LoadingSpinner({ 
  size = 'medium', 
  text, 
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8'
  }

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <div className={`${sizeClasses[size]} animate-spin`}>
        <div className="w-full h-full border-2 border-blue-200 border-t-blue-600 rounded-full"></div>
      </div>
      {text && (
        <span className="text-sm text-gray-600">{text}</span>
      )}
    </div>
  )
}

export function InlineLoadingSpinner({ text }: { text?: string }) {
  return (
    <div className="flex items-center space-x-2">
      <div className="w-4 h-4 animate-spin">
        <div className="w-full h-full border-2 border-blue-200 border-t-blue-600 rounded-full"></div>
      </div>
      {text && <span className="text-sm text-gray-600">{text}</span>}
    </div>
  )
}