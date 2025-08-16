import { ethers } from 'ethers'
import { blockchainService } from './BlockchainService'
import type { TransactionRequest, GasPriceData } from '../types/blockchain'
import { BlockchainError, BlockchainErrorType } from '../types/blockchain'

/**
 * Gas费用估算服务
 * 提供详细的Gas费用计算和预估功能
 */
export class GasEstimationService {
  /**
   * 获取交易的完整Gas费用信息
   */
  async getTransactionGasInfo(transaction: TransactionRequest): Promise<{
    gasLimit: string
    gasPrices: GasPriceData
    totalCosts: {
      slow: string
      standard: string
      fast: string
    }
    totalCostsInETH: {
      slow: string
      standard: string
      fast: string
    }
  }> {
    try {
      // 等待区块链服务初始化
      await blockchainService.waitForInitialization()

      // 估算Gas限制
      const gasLimit = await blockchainService.estimateGas(transaction)
      
      // 获取Gas价格
      const gasPrices = await blockchainService.getGasPrices()

      // 计算总费用（以Gwei为单位）
      const totalCosts = {
        slow: this.calculateTotalGasCost(gasLimit.toString(), gasPrices.slow),
        standard: this.calculateTotalGasCost(gasLimit.toString(), gasPrices.standard),
        fast: this.calculateTotalGasCost(gasLimit.toString(), gasPrices.fast)
      }

      // 转换为ETH
      const totalCostsInETH = {
        slow: ethers.formatEther(ethers.parseUnits(totalCosts.slow, 'gwei')),
        standard: ethers.formatEther(ethers.parseUnits(totalCosts.standard, 'gwei')),
        fast: ethers.formatEther(ethers.parseUnits(totalCosts.fast, 'gwei'))
      }

      return {
        gasLimit: gasLimit.toString(),
        gasPrices,
        totalCosts,
        totalCostsInETH
      }
    } catch (error) {
      throw new BlockchainError(
        BlockchainErrorType.GAS_ESTIMATION_FAILED,
        'Gas费用估算失败',
        error
      )
    }
  }

  /**
   * 计算总Gas费用（Gwei）
   */
  private calculateTotalGasCost(gasLimit: string, gasPrice: string): string {
    const gasLimitBN = BigInt(gasLimit)
    const gasPriceBN = ethers.parseUnits(gasPrice, 'gwei')
    const totalCost = gasLimitBN * gasPriceBN
    return ethers.formatUnits(totalCost, 'gwei')
  }

  /**
   * 获取简化的Gas费用选项
   */
  async getGasOptions(transaction: TransactionRequest): Promise<{
    slow: { price: string; time: number; totalETH: string }
    standard: { price: string; time: number; totalETH: string }
    fast: { price: string; time: number; totalETH: string }
  }> {
    const gasInfo = await this.getTransactionGasInfo(transaction)
    
    return {
      slow: {
        price: gasInfo.gasPrices.slow,
        time: gasInfo.gasPrices.estimatedTime.slow,
        totalETH: gasInfo.totalCostsInETH.slow
      },
      standard: {
        price: gasInfo.gasPrices.standard,
        time: gasInfo.gasPrices.estimatedTime.standard,
        totalETH: gasInfo.totalCostsInETH.standard
      },
      fast: {
        price: gasInfo.gasPrices.fast,
        time: gasInfo.gasPrices.estimatedTime.fast,
        totalETH: gasInfo.totalCostsInETH.fast
      }
    }
  }

  /**
   * 验证Gas费用是否合理
   */
  validateGasFee(gasPrice: string, gasLimit: string): boolean {
    try {
      const gasPriceBN = ethers.parseUnits(gasPrice, 'gwei')
      const gasLimitBN = BigInt(gasLimit)
      
      // 检查Gas价格是否在合理范围内（1 Gwei - 1000 Gwei）
      const minGasPrice = ethers.parseUnits('1', 'gwei')
      const maxGasPrice = ethers.parseUnits('1000', 'gwei')
      
      if (gasPriceBN < minGasPrice || gasPriceBN > maxGasPrice) {
        return false
      }

      // 检查Gas限制是否在合理范围内
      if (gasLimitBN < 21000n || gasLimitBN > 500000n) {
        return false
      }

      return true
    } catch {
      return false
    }
  }

  /**
   * 格式化Gas费用显示
   */
  formatGasFee(gasPrice: string, gasLimit: string): {
    gasPriceGwei: string
    totalCostETH: string
    totalCostGwei: string
  } {
    const totalCostGwei = this.calculateTotalGasCost(gasLimit, gasPrice)
    const totalCostETH = ethers.formatEther(ethers.parseUnits(totalCostGwei, 'gwei'))
    
    return {
      gasPriceGwei: gasPrice,
      totalCostETH: parseFloat(totalCostETH).toFixed(6),
      totalCostGwei: parseFloat(totalCostGwei).toFixed(2)
    }
  }
}

// 导出单例实例
export const gasEstimationService = new GasEstimationService()