import React, { useState } from "react"
import { Button } from "./Button"
import { CryptoService } from "~services/CryptoService"

interface ImportPrivateKeyProps {
  onImportSuccess: (privateKey: string, address: string) => void
  onBack?: () => void
}

export function ImportPrivateKey({ onImportSuccess, onBack }: ImportPrivateKeyProps) {
  const [privateKey, setPrivateKey] = useState('')
  const [derivedAddress, setDerivedAddress] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState('')
  const [showPrivateKey, setShowPrivateKey] = useState(false)

  const handlePrivateKeyChange = async (value: string) => {
    setPrivateKey(value)
    setError('')
    setDerivedAddress('')

    if (!value.trim()) {
      return
    }

    setIsValidating(true)

    try {
      // 验证私钥格式
      const isValid = CryptoService.validatePrivateKey(value.trim())
      
      if (!isValid) {
        setError('私钥格式无效，请检查输入')
        setIsValidating(false)
        return
      }

      // 生成对应的地址
      const address = CryptoService.privateKeyToAddress(value.trim())
      setDerivedAddress(address)
      console.log('私钥验证成功，地址:', address)

    } catch (error) {
      console.error('私钥验证失败:', error)
      setError('私钥验证失败: ' + error.message)
    } finally {
      setIsValidating(false)
    }
  }

  const handleImport = () => {
    if (!privateKey.trim()) {
      setError('请输入私钥')
      return
    }

    if (!derivedAddress) {
      setError('请等待私钥验证完成')
      return
    }

    // 格式化私钥（确保有 0x 前缀）
    const formattedPrivateKey = privateKey.trim().startsWith('0x') 
      ? privateKey.trim() 
      : '0x' + privateKey.trim()

    onImportSuccess(formattedPrivateKey, derivedAddress)
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setPrivateKey(text)
      handlePrivateKeyChange(text)
    } catch (error) {
      console.error('粘贴失败:', error)
      setError('粘贴失败，请手动输入私钥')
    }
  }

  const handleClear = () => {
    setPrivateKey('')
    setDerivedAddress('')
    setError('')
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-4xl mb-3">📥</div>
        <h2 className="text-2xl font-bold text-gray-800">导入私钥</h2>
        <p className="text-gray-600 mt-2">
          输入您的私钥来导入现有账户
        </p>
      </div>

      {/* 安全警告 */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <span className="text-red-600 text-lg">⚠️</span>
          <div className="text-red-800 text-sm space-y-1">
            <div className="font-medium">安全提醒:</div>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>请确保您在安全的环境中操作</li>
              <li>不要在公共场所或不信任的设备上输入私钥</li>
              <li>私钥一旦泄露，您的资产将面临风险</li>
              <li>建议使用助记词而不是私钥来恢复钱包</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 私钥输入 */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            私钥
          </label>
          <div className="space-y-2">
            <div className="relative">
              <textarea
                value={privateKey}
                onChange={(e) => handlePrivateKeyChange(e.target.value)}
                placeholder="输入您的私钥 (64个十六进制字符，可选择性包含0x前缀)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-24 font-mono text-sm"
                style={{ filter: showPrivateKey ? 'none' : 'blur(4px)' }}
              />
              <button
                type="button"
                onClick={() => setShowPrivateKey(!showPrivateKey)}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-sm"
              >
                {showPrivateKey ? '🙈 隐藏' : '👁️ 显示'}
              </button>
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={handlePaste}
                variant="secondary"
                className="flex-1 text-sm py-2"
              >
                📋 粘贴
              </Button>
              <Button
                onClick={handleClear}
                variant="secondary"
                className="flex-1 text-sm py-2"
              >
                🗑️ 清空
              </Button>
            </div>
          </div>
        </div>

        {/* 验证状态 */}
        {isValidating && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <span className="text-blue-600">⏳</span>
              <span className="text-blue-800 text-sm">正在验证私钥...</span>
            </div>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <span className="text-red-600">❌</span>
              <span className="text-red-800 text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* 派生地址显示 */}
        {derivedAddress && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-green-600">✅</span>
                <span className="text-green-800 text-sm font-medium">私钥验证成功</span>
              </div>
              <div className="text-green-800 text-sm">
                <div className="font-medium mb-1">对应的钱包地址:</div>
                <div className="bg-white rounded p-2 font-mono text-xs break-all">
                  {derivedAddress}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 格式说明 */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="text-gray-700 text-sm space-y-2">
          <div className="font-medium">私钥格式说明:</div>
          <div className="text-xs space-y-1">
            <div>• 64个十六进制字符 (0-9, a-f)</div>
            <div>• 可以包含或不包含 "0x" 前缀</div>
            <div>• 示例: 0x1234...abcd 或 1234...abcd</div>
            <div>• 不要包含空格或其他字符</div>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="space-y-3">
        <Button
          onClick={handleImport}
          disabled={!derivedAddress || isValidating}
          className="w-full text-lg py-4"
        >
          📥 导入账户
        </Button>
        
        {onBack && (
          <Button onClick={onBack} variant="secondary" className="w-full">
            ← 返回
          </Button>
        )}
      </div>
    </div>
  )
}