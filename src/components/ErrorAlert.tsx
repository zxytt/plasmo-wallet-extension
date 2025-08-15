import React from "react"

interface ErrorAlertProps {
  error: string
  type?: 'error' | 'warning' | 'info'
  onDismiss?: () => void
  showDismiss?: boolean
}

export function ErrorAlert({ 
  error, 
  type = 'error', 
  onDismiss, 
  showDismiss = false 
}: ErrorAlertProps) {
  const getAlertStyles = () => {
    switch (type) {
      case 'error':
        return {
          container: 'bg-red-50 border-red-200',
          icon: '❌',
          iconColor: 'text-red-600',
          textColor: 'text-red-800'
        }
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200',
          icon: '⚠️',
          iconColor: 'text-yellow-600',
          textColor: 'text-yellow-800'
        }
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-200',
          icon: 'ℹ️',
          iconColor: 'text-blue-600',
          textColor: 'text-blue-800'
        }
      default:
        return {
          container: 'bg-red-50 border-red-200',
          icon: '❌',
          iconColor: 'text-red-600',
          textColor: 'text-red-800'
        }
    }
  }

  const styles = getAlertStyles()

  if (!error) return null

  return (
    <div className={`border rounded-lg p-4 ${styles.container}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2 flex-1">
          <span className={`${styles.iconColor} text-lg flex-shrink-0`}>
            {styles.icon}
          </span>
          <div className={`${styles.textColor} text-sm flex-1`}>
            {error}
          </div>
        </div>
        
        {showDismiss && onDismiss && (
          <button
            onClick={onDismiss}
            className={`${styles.iconColor} hover:opacity-70 ml-2 flex-shrink-0`}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}

// 特定类型的错误提示组件
export function ErrorMessage({ error, onDismiss }: { error: string; onDismiss?: () => void }) {
  return <ErrorAlert error={error} type="error" onDismiss={onDismiss} showDismiss={!!onDismiss} />
}

export function WarningMessage({ error, onDismiss }: { error: string; onDismiss?: () => void }) {
  return <ErrorAlert error={error} type="warning" onDismiss={onDismiss} showDismiss={!!onDismiss} />
}

export function InfoMessage({ error, onDismiss }: { error: string; onDismiss?: () => void }) {
  return <ErrorAlert error={error} type="info" onDismiss={onDismiss} showDismiss={!!onDismiss} />
}