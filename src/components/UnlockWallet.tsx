import React, { useState, useEffect } from "react"
import { Button } from "./Button"
import { ErrorMessage, WarningMessage } from "./ErrorAlert"
import { SecurityService } from "~services/SecurityService"

interface UnlockWalletProps {
  onUnlock: (password: string) => Promise<void>
  onBackToWelcome?: () => void
}

export function UnlockWallet({ onUnlock, onBackToWelcome }: UnlockWalletProps) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [lockoutTime, setLockoutTime] = useState<number | null>(null)

  // 重置尝试次数
  const resetAttempts = () => {
    setAttempts(0)
    setError('')
    setLockoutTime(null)
  }

  // 清理敏感数据
  const clearSensitiveData = () => {
    // 安全清理密码
    SecurityService.clearPassword(password)
    
    setPassword('')
    setError('')
    
    console.log('UnlockWallet: 敏感数据已清理')
  }

  // 组件卸载时清理敏感数据
  useEffect(() => {
    return () => {
      clearSensitiveData()
    }
  }, [])

  // 检查是否在锁定期间
  const isInLockout = () => {
    if (!lockoutTime) return false
    return Date.now() < lockoutTime
  }

  const handleUnlock = async () => {
    if (!password) {
      setError('请输入密码')
      return
    }

    // 检查是否在锁定期间
    if (isInLockout()) {
      const remainingTime = Math.ceil((lockoutTime! - Date.now()) / 1000)
      setError(`请等待 ${remainingTime} 秒后再试`)
      return
    }

    setIsUnlocking(true)
    setError('')

    try {
      await onUnlock(password)
      // 解锁成功，清除密码
      setPassword('')
      setAttempts(0)
    } catch (error) {
      console.error('解锁失败:', error)
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      
      // 根据错误类型提供更友好的错误信息
      if (error.message.includes('密码错误') || error.message.includes('解密失败')) {
        if (newAttempts >= 5) {
          // 设置30秒锁定期
          const lockoutDuration = 30 * 1000 // 30秒
          setLockoutTime(Date.now() + lockoutDuration)
          setError('密码错误次数过多，已锁定30秒。请稍后再试或使用助记词重新导入钱包')
        } else {
          setError(`密码错误，请重试 (${newAttempts}/5)`)
        }
      } else if (error.message.includes('未找到钱包数据')) {
        setError('未找到钱包数据，请先创建或导入钱包')
      } else if (error.message.includes('Chrome 存储 API 不可用')) {
        setError('存储服务不可用，请确保在扩展环境中运行')
      } else {
        setError(`解锁失败: ${error.message}`)
      }
      
      // 清除密码输入
      setPassword('')
    } finally {
      setIsUnlocking(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isUnlocking) {
      handleUnlock()
    }
  }

  const isMaxAttempts = attempts >= 5
  const isLocked = isInLockout()

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-4xl mb-3">🔒</div>
        <h2 className="text-2xl font-bold text-gray-800">解锁钱包</h2>
        <p className="text-gray-600 mt-2">
          输入您的钱包密码来访问您的账户
        </p>
      </div>

      {/* 钱包状态 */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <span className="text-green-600">✅</span>
          <span className="text-green-800 text-sm font-medium">钱包已初始化</span>
        </div>
        <div className="flex items-center space-x-2 mt-1">
          <span className="text-green-600">🌐</span>
          <span className="text-green-800 text-sm">连接到 Sepolia 测试网</span>
        </div>
      </div>

      {/* 密码输入 */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            钱包密码
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
              onKeyPress={handleKeyPress}
              placeholder="请输入您的钱包密码"
              disabled={isUnlocking || isMaxAttempts || isLocked}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 disabled:bg-gray-100 disabled:cursor-not-allowed"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isUnlocking || isMaxAttempts || isLocked}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed"
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <ErrorMessage 
            error={error} 
            onDismiss={() => setError('')}
          />
        )}

        {/* 解锁中提示 */}
        {isUnlocking && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <span className="text-blue-600">⏳</span>
              <span className="text-blue-800 text-sm">正在解锁钱包...</span>
            </div>
          </div>
        )}

        {/* 最大尝试次数警告 */}
        {isMaxAttempts && (
          <WarningMessage 
            error="密码错误次数过多。为了安全起见，请稍后再试或使用助记词重新导入钱包。"
          />
        )}
      </div>

      {/* 操作按钮 */}
      <div className="space-y-3">
        <Button
          onClick={handleUnlock}
          disabled={!password || isUnlocking || isMaxAttempts || isLocked}
          className="w-full text-lg py-4"
        >
          {isUnlocking ? '解锁中...' : isLocked ? '已锁定' : '🔓 解锁钱包'}
        </Button>

        {/* 重置按钮 */}
        {(isMaxAttempts || isLocked) && (
          <Button
            onClick={resetAttempts}
            variant="secondary"
            className="w-full"
            disabled={isUnlocking}
          >
            🔄 重置尝试次数
          </Button>
        )}

        {onBackToWelcome && (
          <Button
            onClick={onBackToWelcome}
            variant="secondary"
            className="w-full"
            disabled={isUnlocking}
          >
            ← 返回欢迎页面
          </Button>
        )}
      </div>

      {/* 帮助信息 */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="text-center space-y-2">
          <div className="text-gray-700 text-sm font-medium">忘记密码？</div>
          <div className="text-gray-600 text-xs space-y-1">
            <div>• 如果忘记密码，您需要使用助记词重新导入钱包</div>
            <div>• 请确保您已安全保存助记词</div>
            <div>• 重新导入不会影响您的资产</div>
          </div>
        </div>
      </div>
    </div>
  )
}