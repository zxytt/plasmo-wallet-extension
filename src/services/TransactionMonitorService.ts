import { transactionService } from './TransactionService'
import { blockchainService } from './BlockchainService'
import type { TransactionRecord } from '../types/blockchain'

/**
 * 交易监控服务
 * 负责监控待确认交易的状态变化并触发相应的更新
 */
export class TransactionMonitorService {
  private monitoringInterval: NodeJS.Timeout | null = null
  private isMonitoring = false
  private listeners: Map<string, Function[]> = new Map()

  /**
   * 开始监控交易状态
   */
  startMonitoring(intervalMs: number = 10000): void {
    if (this.isMonitoring) {
      console.log('交易监控已在运行中')
      return
    }

    console.log('开始交易状态监控，间隔:', intervalMs, 'ms')
    this.isMonitoring = true

    this.monitoringInterval = setInterval(async () => {
      await this.checkAllPendingTransactions()
    }, intervalMs)
  }

  /**
   * 停止监控交易状态
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
    this.isMonitoring = false
    console.log('交易状态监控已停止')
  }

  /**
   * 检查所有待确认交易
   */
  private async checkAllPendingTransactions(): Promise<void> {
    try {
      const allTransactions = await transactionService.getTransactionHistory()
      const pendingTransactions = allTransactions.filter(tx => tx.status === 'pending')

      if (pendingTransactions.length === 0) {
        return
      }

      console.log(`检查 ${pendingTransactions.length} 笔待确认交易`)

      for (const tx of pendingTransactions) {
        await this.checkTransactionStatus(tx)
      }
    } catch (error) {
      console.error('检查待确认交易失败:', error)
    }
  }

  /**
   * 检查单个交易状态
   */
  private async checkTransactionStatus(transaction: TransactionRecord): Promise<void> {
    try {
      const updatedRecord = await transactionService.trackTransaction(transaction.hash)
      
      if (updatedRecord && updatedRecord.status !== transaction.status) {
        console.log(`交易状态更新: ${transaction.hash} -> ${updatedRecord.status}`)
        
        // 触发状态变化事件
        this.emitTransactionStatusChange(updatedRecord, transaction.status)
        
        // 如果交易确认成功，触发余额更新事件
        if (updatedRecord.status === 'success') {
          this.emitBalanceUpdateNeeded(updatedRecord)
        }
      }
    } catch (error) {
      console.error(`检查交易状态失败 (${transaction.hash}):`, error)
    }
  }

  /**
   * 添加交易状态变化监听器
   */
  onTransactionStatusChange(callback: (transaction: TransactionRecord, oldStatus: string) => void): void {
    const eventName = 'statusChange'
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, [])
    }
    this.listeners.get(eventName)!.push(callback)
  }

  /**
   * 添加余额更新需要监听器
   */
  onBalanceUpdateNeeded(callback: (transaction: TransactionRecord) => void): void {
    const eventName = 'balanceUpdate'
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, [])
    }
    this.listeners.get(eventName)!.push(callback)
  }

  /**
   * 移除监听器
   */
  removeListener(eventName: string, callback: Function): void {
    const listeners = this.listeners.get(eventName)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  /**
   * 触发交易状态变化事件
   */
  private emitTransactionStatusChange(transaction: TransactionRecord, oldStatus: string): void {
    const listeners = this.listeners.get('statusChange') || []
    listeners.forEach(callback => {
      try {
        callback(transaction, oldStatus)
      } catch (error) {
        console.error('交易状态变化回调执行失败:', error)
      }
    })
  }

  /**
   * 触发余额更新需要事件
   */
  private emitBalanceUpdateNeeded(transaction: TransactionRecord): void {
    const listeners = this.listeners.get('balanceUpdate') || []
    listeners.forEach(callback => {
      try {
        callback(transaction)
      } catch (error) {
        console.error('余额更新回调执行失败:', error)
      }
    })
  }

  /**
   * 手动检查特定交易
   */
  async checkTransaction(txHash: string): Promise<TransactionRecord | null> {
    try {
      const currentRecord = await transactionService.getTransactionRecord(txHash)
      if (!currentRecord) {
        console.warn('未找到交易记录:', txHash)
        return null
      }

      if (currentRecord.status !== 'pending') {
        return currentRecord
      }

      const updatedRecord = await transactionService.trackTransaction(txHash)
      
      if (updatedRecord && updatedRecord.status !== currentRecord.status) {
        this.emitTransactionStatusChange(updatedRecord, currentRecord.status)
        
        if (updatedRecord.status === 'success') {
          this.emitBalanceUpdateNeeded(updatedRecord)
        }
      }

      return updatedRecord
    } catch (error) {
      console.error('手动检查交易失败:', error)
      return null
    }
  }

  /**
   * 获取监控状态
   */
  isMonitoringActive(): boolean {
    return this.isMonitoring
  }

  /**
   * 获取待确认交易数量
   */
  async getPendingTransactionCount(): Promise<number> {
    try {
      const allTransactions = await transactionService.getTransactionHistory()
      return allTransactions.filter(tx => tx.status === 'pending').length
    } catch (error) {
      console.error('获取待确认交易数量失败:', error)
      return 0
    }
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.stopMonitoring()
    this.listeners.clear()
  }
}

// 导出单例实例
export const transactionMonitorService = new TransactionMonitorService()