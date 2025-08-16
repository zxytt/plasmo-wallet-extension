import React, { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Button } from "./Button"
import { Input } from "./Input"
import { ConfirmDialog } from "./ConfirmDialog"
import { blockchainService } from "~services/BlockchainService"
import { BlockchainError, BlockchainErrorType } from "~types/blockchain"
import type { TransactionRequest, GasPriceData } from "~types/blockchain"

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
  const [gasSpeed, setGasSpeed] = useState<'slow' | 'standard' | 'fast'>('standard')
  const [customGasPrice, setCustomGasPrice] = useState("")
  const [useCustomGas, setUseCustomGas] = useState(false)
  
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [isValidating, setIsValidating] = useState(false)
  const [isBuilding, setIsBuilding] = useState(false)
  const [isSending, setIsSending] = useState(false)
  
  const [currentBalance, setCurrentBalance] = useState("")
  const [gasPrices, setGasPrices] = useState<GasPriceData | null>(null)
  const [transactionPreview, setTransactionPreview] = useState<TransactionPreview | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

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

  // 当 gas 设置改变时重新构建交易
  useEffect(() => {
    if (transactionPreview && !validationErrors.address && !validationErrors.amount) {
      buildTransaction()
    }
  }, [gasSpeed, customGasPrice, useCustomGas])

  const loadInitialData = async () => {
    try {
      // 并行加载余额和 gas 价格
      const [balance, gasData] = await Promise.all([
        blockchainService.getETHBalance(currentAccount.address),
        blockchainService.getGasPrices()
      ])
      
      setCurrentBalance(balance)
      setGasPrices(gasData)
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
    if (!recipientAddress || !amount || !gasPrices) return

    setIsBuilding(true)
    try {
      // 构建基础交易
      const transaction: TransactionRequest = {
        to: recipientAddress,
        value: ethers.parseEther(amount).toString()
      }

      // 设置 gas 价格
      let gasPrice: string
      if (useCustomGas && customGasPrice) {
        gasPrice = ethers.parseUnits(customGasPrice, 'gwei').toString()
      } else {
        const gasPriceGwei = gasPrices[gasSpeed]
        gasPrice = ethers.parseUnits(gasPriceGwei, 'gwei').toString()
      }
      transaction.gasPrice = gasPrice

      // 估算 gas 限制
      const gasLimit = await blockchainService.estimateGas(transaction)
      transaction.gasLimit = gasLimit.toString()

      // 计算总费用
      const gasCost = gasLimit * BigInt(gasPrice)
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

      setTransactionPreview({
        to: recipientAddress,
        amount,
        gasLimit: gasLimit.toString(),
        gasPrice: ethers.formatUnits(gasPrice, 'gwei'),
        totalCost,
        transaction
      })

    } catch (error) {
      console.error("构建交易失败:", error)
      if (error instanceof BlockchainError) {
        if (error.type === BlockchainErrorType.GAS_ESTIMATION_FAILED) {
          setValidationErrors({ general: "Gas 费用估算失败，请检查交易参数" })
        } else {
          setValidationErrors({ general: error.message })
        }
      } else {
        setValidationErrors({ general: "构建交易失败，请重试" })
      }
      setTransactionPreview(null)
    } finally {
      setIsBuilding(false)
    }
  }

  const handleSendTransaction = async () => {
    if (!transactionPreview) return

    setIsSending(true)
    try {
      // 创建钱包实例
      const provider = blockchainService.getCurrentProvider()
      const wallet = new ethers.Wallet(currentAccount.privateKey, provider)

      // 发送交易
      const txResponse = await wallet.sendTransaction(transactionPreview.transaction)
      
      console.log("交易已发送:", txResponse.hash)
      
      // 通知父组件
      if (onTransactionSent) {
        onTransactionSent(txResponse.hash)
      }

      // 关闭对话框
      setShowConfirmDialog(false)
      onClose()

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

      {/* Gas 费用设置 */}
      {gasPrices && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Gas 费用设置
          </label>
          
          {/* Gas 速度选择 */}
          <div className="grid grid-cols-3 gap-2">
            {(['slow', 'standard', 'fast'] as const).map((speed) => (
              <button
                key={speed}
                type="button"
                onClick={() => {
                  setGasSpeed(speed)
                  setUseCustomGas(false)
                }}
                className={`p-3 rounded-lg border text-sm ${
                  gasSpeed === speed && !useCustomGas
                    ? 'border-blue-500 bg-blue-50 text-blue-800'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium capitalize">
                  {speed === 'slow' ? '慢速' : speed === 'standard' ? '标准' : '快速'}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {gasPrices[speed]} Gwei
                </div>
                <div className="text-xs text-gray-500">
                  ~{gasPrices.estimatedTime[speed]}秒
                </div>
              </button>
            ))}
          </div>

          {/* 自定义 Gas 价格 */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={useCustomGas}
                onChange={(e) => setUseCustomGas(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">自定义 Gas 价格</span>
            </label>
            
            {useCustomGas && (
              <Input
                type="number"
                placeholder="Gas 价格 (Gwei)"
                value={customGasPrice}
                onChange={(value) => setCustomGasPrice(value)}
              />
            )}
          </div>
        </div>
      )}

      {/* 交易预览 */}
      {transactionPreview && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="font-medium text-gray-800">交易预览</div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">接收地址:</span>
              <span className="font-mono text-gray-800">
                {transactionPreview.to.slice(0, 6)}...{transactionPreview.to.slice(-4)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">转账金额:</span>
              <span className="font-bold text-gray-800">
                {transactionPreview.amount} ETH
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Gas 费用:</span>
              <span className="text-gray-800">
                {ethers.formatEther(
                  BigInt(transactionPreview.gasLimit) * BigInt(ethers.parseUnits(transactionPreview.gasPrice, 'gwei'))
                )} ETH
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Gas 价格:</span>
              <span className="text-gray-800">
                {transactionPreview.gasPrice} Gwei
              </span>
            </div>
            
            <div className="border-t border-gray-300 pt-2">
              <div className="flex justify-between font-bold">
                <span className="text-gray-800">总费用:</span>
                <span className="text-gray-900">
                  {parseFloat(transactionPreview.totalCost).toFixed(6)} ETH
                </span>
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

      {/* 确认对话框 */}
      {showConfirmDialog && transactionPreview && (
        <ConfirmDialog
          isOpen={showConfirmDialog}
          onClose={() => setShowConfirmDialog(false)}
          onConfirm={handleSendTransaction}
          title="确认发送交易"
          message={
            <div className="space-y-3">
              <p>请确认以下交易信息:</p>
              
              <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>接收地址:</span>
                  <span className="font-mono">{transactionPreview.to}</span>
                </div>
                <div className="flex justify-between">
                  <span>转账金额:</span>
                  <span className="font-bold">{transactionPreview.amount} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span>总费用:</span>
                  <span className="font-bold">{parseFloat(transactionPreview.totalCost).toFixed(6)} ETH</span>
                </div>
              </div>
              
              <p className="text-red-600 text-sm">
                ⚠️ 交易一旦发送将无法撤销，请仔细核对信息。
              </p>
            </div>
          }
          confirmText={isSending ? "发送中..." : "确认发送"}
          cancelText="取消"
          confirmButtonVariant="primary"
          isLoading={isSending}
        />
      )}
    </div>
  )
}