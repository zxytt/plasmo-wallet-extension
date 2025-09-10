import { ethers } from 'ethers'

import type { TransactionRecord } from '../types/blockchain'
import { blockchainService } from './BlockchainService'
import { transactionService } from './TransactionService'

/**
 * 交易同步服务
 * 负责从链上获取交易数据并与本地存储同步
 */
export class TransactionSyncService {
	private issyncing = false
	private lastSyncBlock: number = 0

	/**
	 * 从链上同步用户的所有交易
	 */
	async syncTransactionsFromChain(
		userAddress: string,
		fromBlock: number = 0
	): Promise<void> {
		if (this.issyncing) {
			console.log('交易同步正在进行中...')
			return
		}

		try {
			this.issyncing = true
			console.log(`开始同步地址 ${userAddress} 的交易数据...`)

			const provider = blockchainService.getCurrentProvider()
			const currentBlock = await provider.getBlockNumber()

			// 获取发送的交易
			const sentTxs = await this.getTransactionsByAddress(
				userAddress,
				'from',
				fromBlock,
				currentBlock
			)

			// 获取接收的交易
			const receivedTxs = await this.getTransactionsByAddress(
				userAddress,
				'to',
				fromBlock,
				currentBlock
			)

			// 合并并去重
			const allTxs = [...sentTxs, ...receivedTxs]
			const uniqueTxs = this.deduplicateTransactions(allTxs)

			console.log(`从链上获取到 ${uniqueTxs.length} 笔交易`)

			// 与本地存储同步
			await this.syncWithLocalStorage(uniqueTxs)

			this.lastSyncBlock = currentBlock
			console.log('交易同步完成')
		} catch (error) {
			console.error('交易同步失败:', error)
			throw error
		} finally {
			this.issyncing = false
		}
	}

	/**
	 * 获取指定地址的交易（发送或接收）
	 */
	private async getTransactionsByAddress(
		address: string,
		direction: 'from' | 'to',
		fromBlock: number,
		toBlock: number
	): Promise<TransactionRecord[]> {
		const provider = blockchainService.getCurrentProvider()
		const transactions: TransactionRecord[] = []

		try {
			// 注意：这里使用简化的方法，实际生产环境中可能需要使用
			// Etherscan API 或其他索引服务来高效获取交易历史

			// 分批查询避免超时
			const batchSize = 1000
			for (let start = fromBlock; start <= toBlock; start += batchSize) {
				const end = Math.min(start + batchSize - 1, toBlock)

				console.log(`查询区块 ${start} 到 ${end}...`)

				// 这里应该使用更高效的方法，比如事件过滤
				// 当前实现仅作为示例
				const filter =
					direction === 'from'
						? { fromBlock: start, toBlock: end, from: address }
						: { fromBlock: start, toBlock: end, to: address }

				// 实际实现中，你可能需要：
				// 1. 使用 Etherscan API
				// 2. 使用 The Graph 等索引服务
				// 3. 监听 Transfer 事件等

				// 这里暂时跳过实际的区块链查询，因为会很慢
				// 在真实环境中，建议使用专门的API服务
			}
		} catch (error) {
			console.error(`获取${direction}交易失败:`, error)
		}

		return transactions
	}

	/**
	 * 使用 Etherscan API 获取交易历史（推荐方法）
	 */
	async syncWithEtherscanAPI(userAddress: string): Promise<void> {
		try {
			console.log('使用 Etherscan API 同步交易...')

			// Sepolia 测试网的 Etherscan API
			const apiKey = 'YourEtherscanAPIKey' // 需要申请API密钥
			const baseUrl = 'https://api-sepolia.etherscan.io/api'

			// 获取普通交易
			const normalTxUrl = `${baseUrl}?module=account&action=txlist&address=${userAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`

			// 获取内部交易
			const internalTxUrl = `${baseUrl}?module=account&action=txlistinternal&address=${userAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`

			const [normalResponse, internalResponse] = await Promise.all([
				fetch(normalTxUrl).then((r) => r.json()),
				fetch(internalTxUrl).then((r) => r.json())
			])

			if (normalResponse.status === '1') {
				const transactions = this.parseEtherscanTransactions(
					normalResponse.result,
					userAddress
				)
				await this.syncWithLocalStorage(transactions)
				console.log(`同步了 ${transactions.length} 笔普通交易`)
			}

			if (internalResponse.status === '1') {
				const internalTxs = this.parseEtherscanTransactions(
					internalResponse.result,
					userAddress
				)
				await this.syncWithLocalStorage(internalTxs)
				console.log(`同步了 ${internalTxs.length} 笔内部交易`)
			}
		} catch (error) {
			console.error('Etherscan API 同步失败:', error)
			// 降级到本地存储
			console.log('降级使用本地存储的交易记录')
		}
	}

	/**
	 * 解析 Etherscan API 返回的交易数据
	 */
	private parseEtherscanTransactions(
		apiTxs: any[],
		userAddress: string
	): TransactionRecord[] {
		return apiTxs.map((tx) => ({
			hash: tx.hash,
			from: tx.from,
			to: tx.to,
			value: tx.value, // 已经是wei字符串
			gasUsed: tx.gasUsed,
			gasPrice: tx.gasPrice,
			status:
				tx.txreceipt_status === '1'
					? ('success' as const)
					: ('failed' as const),
			timestamp: parseInt(tx.timeStamp) * 1000, // 转换为毫秒
			type: 'eth' as const,
			blockNumber: parseInt(tx.blockNumber)
		}))
	}

	/**
	 * 去重交易记录
	 */
	private deduplicateTransactions(
		transactions: TransactionRecord[]
	): TransactionRecord[] {
		const seen = new Set<string>()
		return transactions.filter((tx) => {
			if (seen.has(tx.hash)) {
				return false
			}
			seen.add(tx.hash)
			return true
		})
	}

	/**
	 * 与本地存储同步
	 */
	private async syncWithLocalStorage(
		chainTxs: TransactionRecord[]
	): Promise<void> {
		const localTxs = await transactionService.getTransactionHistory()
		const localTxMap = new Map(localTxs.map((tx) => [tx.hash, tx]))

		for (const chainTx of chainTxs) {
			const localTx = localTxMap.get(chainTx.hash)

			if (!localTx) {
				// 新交易，添加到本地
				await (transactionService as any).saveTransactionRecord(chainTx)
				console.log(`添加新交易: ${chainTx.hash}`)
			} else if (
				localTx.status === 'pending' &&
				chainTx.status !== 'pending'
			) {
				// 更新待确认交易的状态
				await (transactionService as any).updateTransactionRecord(
					chainTx.hash,
					{
						status: chainTx.status,
						gasUsed: chainTx.gasUsed,
						blockNumber: chainTx.blockNumber
					}
				)
				console.log(
					`更新交易状态: ${chainTx.hash} -> ${chainTx.status}`
				)
			}
		}
	}

	/**
	 * 增量同步（只同步新的交易）
	 */
	async incrementalSync(userAddress: string): Promise<void> {
		if (this.lastSyncBlock === 0) {
			// 首次同步，获取最近的交易
			const provider = blockchainService.getCurrentProvider()
			const currentBlock = await provider.getBlockNumber()
			const fromBlock = Math.max(0, currentBlock - 10000) // 最近10000个区块

			await this.syncTransactionsFromChain(userAddress, fromBlock)
		} else {
			// 增量同步
			await this.syncTransactionsFromChain(
				userAddress,
				this.lastSyncBlock + 1
			)
		}
	}

	/**
	 * 获取同步状态
	 */
	getSyncStatus(): { issyncing: boolean; lastSyncBlock: number } {
		return {
			issyncing: this.issyncing,
			lastSyncBlock: this.lastSyncBlock
		}
	}
}

// 导出单例实例
export const transactionSyncService = new TransactionSyncService()
