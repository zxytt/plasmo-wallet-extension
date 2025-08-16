import React from "react"
import { ethers } from "ethers"
import { Button } from "./Button"
import type { TransactionRequest } from "~types/blockchain"

interface TransactionConfirmDialogProps {
  isOpen: boolean
  transaction: TransactionRequest
  fromAddress: string
  amount: string
  gasLimit: string
  gasPrice: string
  totalCost: string
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
  title?: string
}

export function TransactionConfirmDialog({
  isOpen,
  transaction,
  fromAddress,
  amount,
  gasLimit,
  gasPrice,
  totalCost,
  onConfirm,
  onCancel,
  isLoading = false,
  title = "确认发送交易"
}: TransactionConfirmDialogProps) {
  if (!isOpen) return null

  const gasCost = ethers.formatEther(
    BigInt(gasLimit) * BigInt(ethers.parseUnits(gasPrice, 'gwei'))
  )

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-md">
        {/* 头部 */}
        <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-t-lg">
          <div className="flex items-start space-x-3">
            <span className="text-2xl flex-shrink-0">⚠️</span>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                {title}
              </h3>
              <p className="text-sm text-yellow-700">
                请仔细核对以下交易信息，交易一旦发送将无法撤销。
              </p>
            </div>
          </div>
        </div>
        
        {/* 交易详情 */}
        <div className="p-6 theme-surface">
          <div className="space-y-4">
            {/* 发送方信息 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">
                发送方
              </div>
              <div className="font-mono text-sm text-gray-800 break-all">
                {fromAddress}
              </div>
            </div>

            {/* 接收方信息 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">
                接收方
              </div>
              <div className="font-mono text-sm text-gray-800 break-all">
                {transaction.to}
              </div>
            </div>

            {/* 转账金额 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-blue-800 font-medium">转账金额</span>
                <span className="text-blue-900 font-bold text-xl">
                  {amount} ETH
                </span>
              </div>
            </div>

            {/* Gas 费用详情 */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                Gas 费用详情
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Gas 限制:</span>
                  <span className="text-gray-800 font-mono">
                    {parseInt(gasLimit).toLocaleString()}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Gas 价格:</span>
                  <span className="text-gray-800">
                    {parseFloat(gasPrice).toFixed(1)} Gwei
                  </span>
                </div>
                
                <div className="flex justify-between border-t border-gray-200 pt-2">
                  <span className="text-gray-600 font-medium">Gas 费用:</span>
                  <span className="text-gray-800 font-medium">
                    {parseFloat(gasCost).toFixed(8)} ETH
                  </span>
                </div>
              </div>
            </div>

            {/* 总费用 */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-orange-800 font-medium">总费用</div>
                  <div className="text-xs text-orange-600">转账金额 + Gas 费用</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-orange-900">
                    {parseFloat(totalCost).toFixed(6)} ETH
                  </div>
                </div>
              </div>
            </div>

            {/* 网络信息 */}
            <div className="text-xs text-gray-500 text-center">
              交易将在 Sepolia 测试网络上执行
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="p-6 bg-gray-50 rounded-b-lg">
          <div className="flex space-x-3">
            <Button
              onClick={onCancel}
              variant="secondary"
              className="flex-1"
              disabled={isLoading}
            >
              取消
            </Button>
            
            <Button
              onClick={onConfirm}
              variant="primary"
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>发送中...</span>
                </div>
              ) : (
                "确认发送"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}