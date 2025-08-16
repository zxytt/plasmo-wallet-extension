import React, { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Button } from "./Button"
import { Input } from "./Input"
import { TransactionConfirmDialog } from "./TransactionConfirmDialog"
import { TransactionStatus } from "./TransactionStatus"
import { GasFeeSelector, type GasSpeed } from "./GasFeeSelector"
import { blockchainService } from "~services/BlockchainService"
import { transactionService } from "~services/TransactionService"
import { BlockchainError } from "~types/blockchain"
import type { TransactionRequest } from "~types/blockchain"

interface SendETHProps {
  currentAccount: {
    address: string
    privateKey: string
  }
  onClose: () => void
  onTransactionSent?: (txHash: string) => void
}

interface ValidationErrors {
  address?: string
  amount?: string
  general?: string
}

interface TransactionPreview {
  to: string
  amount: string
  gasLimit: string
  gasPrice: string
  totalCost: string
  transaction: TransactionRequest
}

export function SendETH({ currentAccount, onClose, onTransactionSent }: SendETHProps) {
  const [recipientAddress, setRecipientAddress] = useState("")
  const [amount, setAmount] = useState("")
  const [gasSpeed, setGasSpeed] = useState<GasSpeed>('standard')
  const [gasInfo, setGasInfo] = useState<{ gasLimit: string; gasPrice: string } | null>(null)
  
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [isValidating, setIsValidating] = useState(false)
  const [isBuilding, setIsBuilding] = useState(false)
  const [isSending, setIsSending] = useState(false)
  
  const [currentBalance, setCurrentBalance] = useState("")
  const [transactionPreview, setTransactionPreview] = useState<TransactionPreview | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showTransactionStatus, setShowTransactionStatus] = useState(false)
  const [sentTxHash, setSentTxHash] = useState<string | null>(null)

  // 加载初始数据
  useEffect(() => {
    loadInitialData()
  }, [])

  // 实时验证输入
  useEffect(() => {
    if (recipientAddress || amount) {
      validateInputs()
    }
  }, [recipientAddress, amount, currentBalance])

  // 当 gas 信息更新时重新构建交易预览
  useEffect(() => {
    if (gasInfo && recipientAddress && amount && !validationErrors.address && !validationErrors.amount) {
      updateTransactionPreview()
    }
  }, [gasInfo])

  const loadInitialData = async () => {
    try {
      const balance = await blockchainService.getETHBalance(currentAccount.address)
      setCurrentBalance(balance)
    } catch (error) {
      console.error("加载初始数据失败:", error)
      setValidationErrors({ general: "加载数据失败，请重试" })
    }
  }

  const validateInputs = async () => {
    setIsValidating(true)
    const errors: ValidationErrors = {}

    try {
      // 验证接收地址
      if (recipientAddress) {
        if (!ethers.isAddress(recipientAddress)) {
          errors.address = "无效的以太坊地址格式"
        } else if (recipientAddress.toLowerCase() === currentAccount.address.toLowerCase()) {
          errors.address = "不能向自己的地址转账"
        }
      }

      // 验证转账金额
      if (amount) {
        try {
          const amountBN = ethers.parseEther(amount)
          if (amountBN <= 0n) {
            errors.amount = "转账金额必须大于 0"
          } else if (currentBalance) {
            const balanceBN = ethers.parseEther(currentBalance)
            if (amountBN > balanceBN) {
              errors.amount = "余额不足"
            }
          }
        } catch {
          errors.amount = "无效的金额格式"
        }
      }

      setValidationErrors(errors)

      // 如果验证通过且两个字段都有值，构建交易预览
      if (Object.keys(errors).length === 0 && recipientAddress && amount) {
        await buildTransaction()
      } else {
        setTransactionPreview(null)
      }
    } catch (error) {
      console.error("验证失败:", error)
      setValidationErrors({ general: "验证失败，请重试" })
    } finally {
      setIsValidating(false)
    }
  }

  const buildTransaction = async () => {
    if (!recipientAddress || !amount) return

    setIsBuilding(true)
    try {
      // 构建基础交易用于Gas估算
      const transaction: TransactionRequest = {
        to: recipientAddress,
        value: ethers.parseEther(amount).toString()
      }

      // 触发Gas费用选择器更新
      // 实际的交易构建会在Gas信息更新后通过updateTransactionPreview完成
      setTransactionPreview(null)

    } catch (error) {
      console.error("构建交易失败:", error)
      setValidationErrors({ general: "构建交易失败，请重试" })
      setTransactionPreview(null)
    } finally {
      setIsBuilding(false)
    }
  }

  const updateTransactionPreview = async () => {
    if (!recipientAddress || !amount || !gasInfo) return

    try {
      // 构建完整交易
      const gasPrice = ethers.parseUnits(gasInfo.gasPrice, 'gwei')
      const transaction: TransactionRequest = {
        to: recipientAddress,
        value: ethers.parseEther(amount).toString(),
        gasLimit: gasInfo.gasLimit,
        gasPrice: gasPrice.toString()
      }

      // 计算总费用
      const gasCost = BigInt(gasInfo.gasLimit) * gasPrice
      const totalAmount = ethers.parseEther(amount) + gasCost
      const totalCost = ethers.formatEther(totalAmount)

      // 检查总费用是否超过余额
      if (currentBalance) {
        const balanceBN = ethers.parseEther(currentBalance)
        if (totalAmount > balanceBN) {
          setValidationErrors({ 
            amount: `余额不足支付交易费用。需要 ${totalCost} ETH，但只有 ${currentBalance} ETH` 
          })
          setTransactionPreview(null)
          return
        }
      }

      // 清除余额不足错误（如果之前有的话）
      if (validationErrors.amount?.includes('余额不足支付交易费用')) {
        const newErrors = { ...validationErrors }
        delete newErrors.amount
        setValidationErrors(newErrors)
      }

      setTransactionPreview({
        to: recipientAddress,
        amount,
        gasLimit: gasInfo.gasLimit,
        gasPrice: gasInfo.gasPrice,
        totalCost,
        transaction
      })

    } catch (error) {
      console.error("更新交易预览失败:", error)
      setTransactionPreview(null)
    }
  }

  const handleSendTransaction = async () => {
    if (!transactionPreview) return

    setIsSending(true)
    try {
      console.log('开始发送交易...')
      
      // 使用 TransactionService 签名并发送交易
      const txHash = await transactionService.signAndSendTransaction(
        transactionPreview.transaction,
        currentAccount.privateKey
      )
      
      console.log("交易已发送:", txHash)
      
      // 保存交易哈希并显示状态页面
      setSentTxHash(txHash)
      setShowConfirmDialog(false)
      setShowTransactionStatus(true)
      
      // 通知父组件
      if (onTransactionSent) {
        onTransactionSent(txHash)
      }

      // 开始跟踪交易状态
      transactionService.waitForTransaction(txHash).then((record) => {
        if (record) {
          console.log('交易确认完成:', record)
          // 可以在这里更新余额或发送通知
        }
      }).catch((error) => {
        console.error('交易确认失败:', error)
      })

    } catch (error) {
      console.error("发送交易失败:", error)
      let errorMessage = "发送交易失败"
      
      if (error instanceof BlockchainError) {
        errorMessage = error.message
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        errorMessage = "余额不足支付交易费用"
      } else if (error.code === 'USER_REJECTED') {
        errorMessage = "用户取消了交易"
      }
      
      setValidationErrors({ general: errorMessage })
      setShowConfirmDialog(false)
    } finally {
      setIsSending(false)
    }
  }

  const canProceed = !isValidating && !isBuilding && transactionPreview && Object.keys(validationErrors).length === 0

  // 如果显示交易状态，渲染交易状态组件
  if (showTransactionStatus && sentTxHash) {
    return (
      <TransactionStatus
        txHash={sentTxHash}
        onClose={() => {
          setShowTransactionStatus(false)
          setSentTxHash(null)
          onClose()
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="text-center">
        <div className="text-4xl mb-3">💸</div>
        <h2 className="text-2xl font-bold text-gray-800">发送 ETH</h2>
        <p className="text-gray-600 mt-1">
          向其他地址转账以太坊
        </p>
      </div>

      {/* 当前余额显示 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-blue-800 font-medium">当前余额</span>
          <span className="text-blue-900 font-bold text-lg">
            {currentBalance ? `${parseFloat(currentBalance).toFixed(6)} ETH` : "加载中..."}
          </span>
        </div>
        <div className="text-xs text-blue-600 mt-1">
          发送地址: {currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}
        </div>
      </div>

      {/* 接收地址输入 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          接收地址 *
        </label>
        <Input
          type="text"
          placeholder="0x..."
          value={recipientAddress}
          onChange={(value) => setRecipientAddress(value)}
          error={validationErrors.address}
          className="font-mono text-sm"
        />
        <div className="text-xs text-gray-500">
          请输入有效的以太坊地址
        </div>
      </div>

      {/* 转账金额输入 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          转账金额 (ETH) *
        </label>
        <Input
          type="number"
          placeholder="0.0"
          value={amount}
          onChange={(value) => setAmount(value)}
          error={validationErrors.amount}
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>最小金额: 0.000001 ETH</span>
          {currentBalance && (
            <button
              type="button"
              onClick={() => {
                // 设置为最大可用金额（预留一些 gas 费用）
                const maxAmount = Math.max(0, parseFloat(currentBalance) - 0.001)
                setAmount(maxAmount.toString())
              }}
              className="text-blue-600 hover:text-blue-800"
            >
              使用最大金额
            </button>
          )}
        </div>
      </div>

      {/* Gas 费用选择 */}
      {recipientAddress && amount && !validationErrors.address && !validationErrors.amount && (
        <GasFeeSelector
          transaction={{
            to: recipientAddress,
            value: ethers.parseEther(amount).toString()
          }}
          selectedSpeed={gasSpeed}
          onSpeedChange={setGasSpeed}
          onGasInfoUpdate={setGasInfo}
        />
      )}

      {/* 交易预览 */}
      {transactionPreview && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center space-x-2">
            <div className="text-blue-600">📋</div>
            <div className="font-medium text-blue-900">交易预览</div>
          </div>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">接收地址:</span>
              <span className="font-mono text-gray-900 bg-white px-2 py-1 rounded text-xs">
                {transactionPreview.to.slice(0, 6)}...{transactionPreview.to.slice(-4)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-700">转账金额:</span>
              <span className="font-bold text-lg text-gray-900">
                {transactionPreview.amount} ETH
              </span>
            </div>
            
            <div className="bg-white rounded-lg p-3 space-y-2">
              <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                Gas 费用详情
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Gas 限制:</span>
                <span className="text-gray-800 font-mono">
                  {parseInt(transactionPreview.gasLimit).toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Gas 价格:</span>
                <span className="text-gray-800">
                  {parseFloat(transactionPreview.gasPrice).toFixed(1)} Gwei
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Gas 费用:</span>
                <span className="text-gray-800 font-medium">
                  {ethers.formatEther(
                    BigInt(transactionPreview.gasLimit) * BigInt(ethers.parseUnits(transactionPreview.gasPrice, 'gwei'))
                  ).slice(0, 8)} ETH
                </span>
              </div>
            </div>
            
            <div className="border-t border-blue-200 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">总费用:</span>
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900">
                    {parseFloat(transactionPreview.totalCost).toFixed(6)} ETH
                  </div>
                  <div className="text-xs text-gray-600">
                    转账 + Gas 费用
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 错误信息 */}
      {validationErrors.general && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="text-red-800 text-sm">
            ⚠️ {validationErrors.general}
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex space-x-3">
        <Button
          onClick={onClose}
          variant="secondary"
          className="flex-1"
          disabled={isSending}
        >
          取消
        </Button>
        
        <Button
          onClick={() => setShowConfirmDialog(true)}
          className="flex-1"
          disabled={!canProceed || isSending}
        >
          {isValidating ? "验证中..." : isBuilding ? "构建中..." : "发送交易"}
        </Button>
      </div>

      {/* 交易确认对话框 */}
      {showConfirmDialog && transactionPreview && (
        <TransactionConfirmDialog
          isOpen={showConfirmDialog}
          transaction={transactionPreview.transaction}
          fromAddress={currentAccount.address}
          amount={transactionPreview.amount}
          gasLimit={transactionPreview.gasLimit}
          gasPrice={transactionPreview.gasPrice}
          totalCost={transactionPreview.totalCost}
          onConfirm={handleSendTransaction}
          onCancel={() => setShowConfirmDialog(false)}
          isLoading={isSending}
        />
      )}
    </div>
  )
}