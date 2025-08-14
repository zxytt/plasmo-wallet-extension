import React from "react"
import { Button } from "./Button"

interface WalletCreatedProps {
  walletAddress: string
  onContinue: () => void
}

export function WalletCreated({ walletAddress, onContinue }: WalletCreatedProps) {
  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress)
      alert('地址已复制到剪贴板')
    } catch (error) {
      console.error('复制失败:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-gray-800">钱包创建成功！</h2>
        <p className="text-gray-600 mt-2">
          您的 Sepolia 测试网钱包已成功创建并安全保存
        </p>
      </div>

      {/* 成功信息 */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <span className="text-green-600">✅</span>
            <span className="text-green-800 text-sm font-medium">钱包创建完成</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-600">✅</span>
            <span className="text-green-800 text-sm font-medium">助记词已加密保存</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-600">✅</span>
            <span className="text-green-800 text-sm font-medium">私钥已安全存储</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-600">✅</span>
            <span className="text-green-800 text-sm font-medium">已连接到 Sepolia 测试网</span>
          </div>
        </div>
      </div>

      {/* 钱包地址 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-700">您的钱包地址:</div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="font-mono text-sm text-gray-800 break-all">
              {walletAddress}
            </div>
          </div>
          <Button
            onClick={handleCopyAddress}
            variant="secondary"
            className="w-full text-sm"
          >
            📋 复制地址
          </Button>
        </div>
      </div>

      {/* 重要提醒 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <span className="text-yellow-600">⚠️</span>
          <div className="text-yellow-800 text-sm space-y-1">
            <div className="font-medium">重要提醒:</div>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>请妥善保管您的助记词，这是恢复钱包的唯一方式</li>
              <li>不要与任何人分享您的助记词或私钥</li>
              <li>这是测试网钱包，请勿用于主网交易</li>
              <li>您可以从水龙头获取测试 ETH 进行测试</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 下一步操作 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="text-center space-y-2">
          <div className="text-blue-800 text-sm font-medium">下一步您可以:</div>
          <div className="text-blue-700 text-xs space-y-1">
            <div>• 从 Sepolia 水龙头获取测试 ETH</div>
            <div>• 开始使用您的钱包进行测试交易</div>
            <div>• 导入其他账户或创建新账户</div>
          </div>
        </div>
      </div>

      {/* 继续按钮 */}
      <Button onClick={onContinue} className="w-full text-lg py-4">
        开始使用钱包 🚀
      </Button>
    </div>
  )
}