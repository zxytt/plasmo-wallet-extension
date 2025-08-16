import React, { useState, useEffect } from "react"
import { Button } from "./Button"
import { transactionService } from "~services/TransactionService"
import type { TransactionRecord } from "~types/blockchain"

interface TransactionStatusProps {
  txHash: string
  onClose: () => void
  onViewExplorer?: (txHash: string) => void
}

export function TransactionStatus({ 
  txHash, 
  onClose, 
  onViewExplorer 
}: TransactionStatusProps) {
  const [transaction, setTransaction] = useState<TransactionRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTransactionStatus()
    
    // 如果交易还在待确认状态，定期检查状态
    const interval = setInterval(() => {
      if (transaction?.status === 'pending') {
        checkTransactionStatus()
      }
    }, 5000) // 每5秒检查一次

    return () => clearInterval(interval)
  }, [txHash, transaction?.status])

  const loadTransactionStatus = async () => {
    try {
      setIsLoading(true)
      const record = await transactionService.getTransactionRecord(txHash)
      
      if (record) {
        setTransaction(record)
      } else {
        setError('未找到交易记录')
      }
    } catch (error) {
      console.error('加载交易状态失败:', error)
      setError('加载交易状态失败')
    } finally {
      setIsLoading(false)
    }
  }

  const checkTransactionStatus = async () => {
    try {
      const updatedRecord = await transactionService.trackTransaction(txHash)
      if (updatedRecord) {
        setTransaction(updatedRecord)
      }
    } catch (error) {
      console.error('检查交易状态失败:', error)
    }
  }

  const handleViewExplorer = () => {
    const explorerUrl = `https://sepolia.etherscan.io/tx/${txHash}`
    if (onViewExplorer) {
      onViewExplorer(txHash)
    } else {
      window.open(explorerUrl, '_blank')
    }
  }

  const getStatusDisplay = () => {
    if (!transaction) return null

    switch (transaction.status) {
      case 'pending':
        return {
          icon: '⏳',
          text: '待确认',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        }
      case 'success':
        return {
          icon: '✅',
          text: '交易成功',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        }
      case 'failed':
        return {
          icon: '❌',
          text: '交易失败',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        }
      default:
        return {
          icon: '❓',
          text: '未知状态',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        }
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-4xl mb-3">⏳</div>
          <h2 className="text-2xl font-bold text-gray-800">加载交易状态</h2>
          <p className="text-gray-600 mt-1">正在获取交易信息...</p>
        </div>
        
        <div className="flex justify-center">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-4xl mb-3">❌</div>
          <h2 className="text-2xl font-bold text-gray-800">加载失败</h2>
          <p className="text-gray-600 mt-1">{error}</p>
        </div>
        
        <div className="flex space-x-3">
          <Button onClick={loadTransactionStatus} variant="secondary" className="flex-1">
            重试
          </Button>
          <Button onClick={onClose} className="flex-1">
            关闭
          </Button>
        </div>
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-4xl mb-3">❓</div>
          <h2 className="text-2xl font-bold text-gray-800">未找到交易</h2>
          <p className="text-gray-600 mt-1">无法找到交易记录</p>
        </div>
        
        <Button onClick={onClose} className="w-full">
          关闭
        </Button>
      </div>
    )
  }

  const statusDisplay = getStatusDisplay()!

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="text-center">
        <div className="text-4xl mb-3">{statusDisplay.icon}</div>
        <h2 className="text-2xl font-bold text-gray-800">交易状态</h2>
        <p className="text-gray-600 mt-1">
          {statusDisplay.text}
        </p>
      </div>

      {/* 状态卡片 */}
      <div className={`${statusDisplay.bgColor} border ${statusDisplay.borderColor} rounded-lg p-4`}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className={`font-medium ${statusDisplay.color}`}>状态</span>
            <span className={`font-bold ${statusDisplay.color}`}>
              {statusDisplay.text}
            </span>
          </div>
          
          {transaction.blockNumber && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">区块号:</span>
              <span className="text-gray-800 font-mono">
                {transaction.blockNumber.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 交易详情 */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">
          交易详情
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">交易哈希:</span>
            <span className="text-gray-800 font-mono text-xs break-all">
              {transaction.hash}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">发送方:</span>
            <span className="text-gray-800 font-mono text-xs">
              {transaction.from.slice(0, 6)}...{transaction.from.slice(-4)}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">接收方:</span>
            <span className="text-gray-800 font-mono text-xs">
              {transaction.to.slice(0, 6)}...{transaction.to.slice(-4)}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">金额:</span>
            <span className="text-gray-800 font-bold">
              {parseFloat(transaction.value).toFixed(6)} ETH
            </span>
          </div>
          
          {transaction.gasUsed !== '0' && (
            <div className="flex justify-between">
              <span className="text-gray-600">Gas 使用:</span>
              <span className="text-gray-800 font-mono">
                {parseInt(transaction.gasUsed).toLocaleString()}
              </span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span className="text-gray-600">时间:</span>
            <span className="text-gray-800">
              {new Date(transaction.timestamp).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex space-x-3">
        <Button
          onClick={handleViewExplorer}
          variant="secondary"
          className="flex-1"
        >
          在浏览器中查看
        </Button>
        
        <Button
          onClick={onClose}
          className="flex-1"
        >
          完成
        </Button>
      </div>

      {/* 待确认状态的额外信息 */}
      {transaction.status === 'pending' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-blue-800 text-sm">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="font-medium">交易正在确认中</span>
            </div>
            <p className="text-xs text-blue-600">
              交易已提交到网络，正在等待矿工确认。通常需要几分钟时间。
            </p>
          </div>
        </div>
      )}
    </div>
  )
}