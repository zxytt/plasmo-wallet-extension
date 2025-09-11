import { ethers } from 'ethers'

import type {
	BlockchainErrorType,
	GasPriceData,
	TransactionRecord,
	TransactionRequest
} from '../types/blockchain'
import { BlockchainError } from '../types/blockchain'
import { blockchainService } from './BlockchainService'
import { StorageService } from './StorageService'

/**
 * 交易服务类
 * 处理交易构建、签名、发送和状态跟踪
 */
export class TransactionService {
	/**
	 * 构建 ETH 转账交易
	 */
	async buildETHTransaction(
		from: string,
		to: string,
		amount: string,
		gasPrice?: string,
		gasLimit?: string
	): Promise<TransactionRequest> {
		try {
			if (!ethers.isAddress(to)) {
				throw new BlockchainError(
					'INVALID_ADDRESS' as BlockchainErrorType,
					'无效的接收地址'
				)
			}

			const amountWei = ethers.parseEther(amount)
			if (amountWei <= 0n) {
				throw new BlockchainError(
					'INVALID_AMOUNT' as BlockchainErrorType,
					'转账金额必须大于 0'
				)
			}

			// 构建基础交易
			const transaction: TransactionRequest = {
				to,
				value: amountWei.toString()
			}

			// 如果提供了 gas 参数，使用它们
			if (gasLimit) {
				transaction.gasLimit = gasLimit
			}

			if (gasPrice) {
				transaction.gasPrice = ethers
					.parseUnits(gasPrice, 'gwei')
					.toString()
			}

			return transaction
		} catch (error) {
			if (error instanceof BlockchainError) {
				throw error
			}
			throw new BlockchainError(
				'TRANSACTION_FAILED' as BlockchainErrorType,
				'构建交易失败',
				error
			)
		}
	}

	/**
	 * 估算交易 Gas 费用
	 */
	async estimateGas(transaction: TransactionRequest): Promise<bigint> {
		try {
			return await blockchainService.estimateGas(transaction)
		} catch (error) {
			throw new BlockchainError(
				'GAS_ESTIMATION_FAILED' as BlockchainErrorType,
				'Gas 费用估算失败',
				error
			)
		}
	}

	/**
	 * 获取 Gas 价格信息
	 */
	async getGasPrice(): Promise<GasPriceData> {
		try {
			return await blockchainService.getGasPrices()
		} catch (error) {
			throw new BlockchainError(
				'GAS_ESTIMATION_FAILED' as BlockchainErrorType,
				'获取 Gas 价格失败',
				error
			)
		}
	}

	/**
	 * 签名并发送交易
	 */
	async signAndSendTransaction(
		transaction: TransactionRequest,
		privateKey: string
	): Promise<string> {
		try {
			// 验证私钥格式
			if (
				!privateKey ||
				(privateKey.length !== 64 && privateKey.length !== 66)
			) {
				throw new BlockchainError(
					'INVALID_ADDRESS' as BlockchainErrorType,
					'无效的私钥格式'
				)
			}

			// 创建钱包实例
			const provider = blockchainService.getCurrentProvider()
			const wallet = new ethers.Wallet(privateKey, provider)

			console.log('开始签名交易...')
			console.log('交易详情:', {
				to: transaction.to,
				value: transaction.value,
				gasLimit: transaction.gasLimit,
				gasPrice: transaction.gasPrice
			})

			// 发送交易（ethers 会自动处理签名）
			const txResponse = await wallet.sendTransaction(transaction)

			console.log('交易已发送到网络:', txResponse.hash)
			console.log('交易详情:', {
				hash: txResponse.hash,
				from: txResponse.from,
				to: txResponse.to,
				value: txResponse.value?.toString(),
				gasLimit: txResponse.gasLimit?.toString(),
				gasPrice: txResponse.gasPrice?.toString()
			})

			// 保存交易记录
			await this.saveTransactionRecord({
				hash: txResponse.hash,
				from: txResponse.from!,
				to: txResponse.to!,
				value: txResponse.value?.toString() || '0',
				gasUsed: '0', // 待确认后更新
				gasPrice: txResponse.gasPrice?.toString() || '0',
				status: 'pending',
				timestamp: Date.now(),
				type: 'eth'
			})

			return txResponse.hash
		} catch (error) {
			console.error('发送交易失败:', error)

			if (error.code === 'INSUFFICIENT_FUNDS') {
				throw new BlockchainError(
					'INSUFFICIENT_FUNDS' as BlockchainErrorType,
					'余额不足支付交易费用'
				)
			} else if (error.code === 'USER_REJECTED') {
				throw new BlockchainError(
					'USER_REJECTED' as BlockchainErrorType,
					'用户取消了交易'
				)
			} else if (error instanceof BlockchainError) {
				throw error
			}

			throw new BlockchainError(
				'TRANSACTION_FAILED' as BlockchainErrorType,
				'发送交易失败',
				error
			)
		}
	}

	/**
	 * 跟踪交易状态
	 */
	async trackTransaction(txHash: string): Promise<TransactionRecord | null> {
		try {
			const receipt =
				await blockchainService.getTransactionReceipt(txHash)

			if (receipt) {
				// 更新交易记录状态
				const updatedRecord: Partial<TransactionRecord> = {
					status: receipt.status === 1 ? 'success' : 'failed',
					gasUsed: receipt.gasUsed.toString(),
					blockNumber: receipt.blockNumber
				}

				await this.updateTransactionRecord(txHash, updatedRecord)

				// 返回完整的交易记录
				return await this.getTransactionRecord(txHash)
			}

			return null
		} catch (error) {
			console.error('跟踪交易状态失败:', error)
			return null
		}
	}

	/**
	 * 等待交易确认
	 */
	async waitForTransaction(
		txHash: string,
		confirmations: number = 1,
		timeout: number = 300000 // 5分钟超时
	): Promise<TransactionRecord | null> {
		try {
			console.log(`等待交易确认: ${txHash}`)

			const receipt = await blockchainService.waitForTransaction(
				txHash,
				confirmations
			)

			if (receipt) {
				console.log('交易已确认:', {
					hash: receipt.hash,
					status: receipt.status,
					blockNumber: receipt.blockNumber,
					gasUsed: receipt.gasUsed.toString()
				})

				// 更新交易记录
				const updatedRecord: Partial<TransactionRecord> = {
					status: receipt.status === 1 ? 'success' : 'failed',
					gasUsed: receipt.gasUsed.toString(),
					blockNumber: receipt.blockNumber
				}

				await this.updateTransactionRecord(txHash, updatedRecord)

				return await this.getTransactionRecord(txHash)
			}

			return null
		} catch (error) {
			console.error('等待交易确认失败:', error)

			// 更新交易状态为失败
			await this.updateTransactionRecord(txHash, { status: 'failed' })

			return null
		}
	}

	/**
	 * 保存交易记录
	 */
	private async saveTransactionRecord(
		record: TransactionRecord
	): Promise<void> {
		try {
			const existingRecords = await this.getTransactionHistory()
			const updatedRecords = [record, ...existingRecords]

			await StorageService.setItem('transaction_history', updatedRecords)
			console.log('交易记录已保存:', record.hash)
		} catch (error) {
			console.error('保存交易记录失败:', error)
		}
	}

	/**
	 * 更新交易记录
	 */
	private async updateTransactionRecord(
		txHash: string,
		updates: Partial<TransactionRecord>
	): Promise<void> {
		try {
			const records = await this.getTransactionHistory()
			const recordIndex = records.findIndex((r) => r.hash === txHash)

			if (recordIndex !== -1) {
				records[recordIndex] = { ...records[recordIndex], ...updates }
				await StorageService.setItem('transaction_history', records)
				console.log('交易记录已更新:', txHash, updates)
			}
		} catch (error) {
			console.error('更新交易记录失败:', error)
		}
	}

	/**
	 * 获取单个交易记录
	 */
	async getTransactionRecord(
		txHash: string
	): Promise<TransactionRecord | null> {
		try {
			const records = await this.getTransactionHistory()
			return records.find((r) => r.hash === txHash) || null
		} catch (error) {
			console.error('获取交易记录失败:', error)
			return null
		}
	}

	/**
	 * 获取交易历史
	 */
	async getTransactionHistory(
		address?: string
	): Promise<TransactionRecord[]> {
		try {
			const records =
				(await StorageService.getItem<TransactionRecord[]>(
					'transaction_history'
				)) || []

			if (address) {
				return records.filter(
					(r) =>
						r.from.toLowerCase() === address.toLowerCase() ||
						r.to.toLowerCase() === address.toLowerCase()
				)
			}

			return records
		} catch (error) {
			console.error('获取交易历史失败:', error)
			return []
		}
	}

	/**
	 * 清除交易历史
	 */
	async clearTransactionHistory(): Promise<void> {
		try {
			await StorageService.removeItem('transaction_history')
			console.log('交易历史已清除')
		} catch (error) {
			console.error('清除交易历史失败:', error)
		}
	}
}

// 导出单例实例
export const transactionService = new TransactionService()
