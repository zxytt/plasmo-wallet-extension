import { ethers } from 'ethers'

import {
	DEFAULT_NETWORK,
	GAS_CONFIG,
	NETWORKS,
	RPC_CONFIG
} from '../config/blockchain'
import type {
	BlockchainErrorType,
	GasPriceData,
	NetworkConfig,
	TransactionRequest,
	UserNFT
} from '../types/blockchain'
import { BlockchainError } from '../types/blockchain'
import { nftToStandardFormat } from '../utils/utils'

/**
 * 核心区块链服务类
 * 封装 ethers.js 提供者管理和基础区块链操作
 */
export class BlockchainService {
	private provider: ethers.JsonRpcProvider | null = null
	private currentNetwork: string = DEFAULT_NETWORK
	private isConnected: boolean = false
	private initializationPromise: Promise<void> | null = null

	constructor() {
		// 异步初始化，不阻塞构造函数
		this.initializationPromise = this.initializeProvider().catch(
			(error) => {
				console.error('BlockchainService 初始化失败:', error)
				throw error
			}
		)
	}

	/**
	 * 初始化提供者
	 */
	async initializeProvider(): Promise<void> {
		try {
			const networkConfig = NETWORKS[this.currentNetwork]
			if (!networkConfig) {
				throw new BlockchainError(
					'NETWORK_ERROR' as BlockchainErrorType,
					`不支持的网络: ${this.currentNetwork}`
				)
			}

			this.provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl, {
				chainId: networkConfig.chainId,
				name: networkConfig.name
			})

			// 设置超时
			this.provider._getConnection().timeout = RPC_CONFIG.timeout

			// 测试连接
			await this.testConnection()
			this.isConnected = true

			console.log(`已连接到 ${networkConfig.name}`)
		} catch (error) {
			this.isConnected = false
			throw new BlockchainError(
				'NETWORK_ERROR' as BlockchainErrorType,
				'初始化区块链提供者失败',
				error
			)
		}
	}

	/**
	 * 测试网络连接
	 */
	private async testConnection(): Promise<void> {
		if (!this.provider) {
			throw new BlockchainError(
				'PROVIDER_NOT_CONNECTED' as BlockchainErrorType,
				'提供者未初始化'
			)
		}

		try {
			await this.provider.getBlockNumber()
		} catch (error) {
			throw new BlockchainError(
				'NETWORK_ERROR' as BlockchainErrorType,
				'网络连接测试失败',
				error
			)
		}
	}

	/**
	 * 获取当前提供者
	 */
	getCurrentProvider(): ethers.JsonRpcProvider {
		if (!this.provider || !this.isConnected) {
			throw new BlockchainError(
				'PROVIDER_NOT_CONNECTED' as BlockchainErrorType,
				'区块链提供者未连接'
			)
		}
		return this.provider
	}

	/**
	 * 获取当前网络配置
	 */
	getCurrentNetwork(): NetworkConfig {
		return NETWORKS[this.currentNetwork]
	}

	/**
	 * 切换网络
	 */
	async switchNetwork(networkKey: string): Promise<void> {
		if (!NETWORKS[networkKey]) {
			throw new BlockchainError(
				'NETWORK_ERROR' as BlockchainErrorType,
				`不支持的网络: ${networkKey}`
			)
		}

		this.currentNetwork = networkKey
		await this.initializeProvider()
	}

	/**
	 * 获取 ETH 余额
	 */
	async getETHBalance(address: string): Promise<string> {
		if (!ethers.isAddress(address)) {
			throw new BlockchainError(
				'INVALID_ADDRESS' as BlockchainErrorType,
				'无效的地址格式'
			)
		}

		try {
			const provider = this.getCurrentProvider()
			console.log('provider', provider)
			const balance = await provider.getBalance(address)
			return ethers.formatEther(balance)
		} catch (error) {
			throw new BlockchainError(
				'NETWORK_ERROR' as BlockchainErrorType,
				'获取 ETH 余额失败',
				error
			)
		}
	}

	/**
	 * 获取当前区块号
	 */
	async getCurrentBlockNumber(): Promise<number> {
		try {
			const provider = this.getCurrentProvider()
			return await provider.getBlockNumber()
		} catch (error) {
			throw new BlockchainError(
				'NETWORK_ERROR' as BlockchainErrorType,
				'获取当前区块号失败',
				error
			)
		}
	}

	/**
	 * 估算 Gas 费用
	 */
	async estimateGas(transaction: TransactionRequest): Promise<bigint> {
		try {
			const provider = this.getCurrentProvider()
			return await provider.estimateGas(transaction)
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
	async getGasPrices(): Promise<GasPriceData> {
		try {
			const provider = this.getCurrentProvider()
			const feeData = await provider.getFeeData()

			if (!feeData.gasPrice) {
				throw new Error('无法获取 Gas 价格')
			}

			const baseGasPrice = feeData.gasPrice
			const { gasPriceMultipliers } = GAS_CONFIG

			return {
				slow: ethers.formatUnits(
					BigInt(
						Math.floor(
							Number(baseGasPrice) * gasPriceMultipliers.slow
						)
					),
					'gwei'
				),
				standard: ethers.formatUnits(baseGasPrice, 'gwei'),
				fast: ethers.formatUnits(
					BigInt(
						Math.floor(
							Number(baseGasPrice) * gasPriceMultipliers.fast
						)
					),
					'gwei'
				),
				estimatedTime: {
					slow: 300, // 5分钟
					standard: 180, // 3分钟
					fast: 60 // 1分钟
				}
			}
		} catch (error) {
			throw new BlockchainError(
				'GAS_ESTIMATION_FAILED' as BlockchainErrorType,
				'获取 Gas 价格失败',
				error
			)
		}
	}

	/**
	 * 获取交易详情
	 */
	async getTransaction(
		txHash: string
	): Promise<ethers.TransactionResponse | null> {
		try {
			const provider = this.getCurrentProvider()
			return await provider.getTransaction(txHash)
		} catch (error) {
			throw new BlockchainError(
				'NETWORK_ERROR' as BlockchainErrorType,
				'获取交易详情失败',
				error
			)
		}
	}

	/**
	 * 获取交易回执
	 */
	async getTransactionReceipt(
		txHash: string
	): Promise<ethers.TransactionReceipt | null> {
		try {
			const provider = this.getCurrentProvider()
			return await provider.getTransactionReceipt(txHash)
		} catch (error) {
			throw new BlockchainError(
				'NETWORK_ERROR' as BlockchainErrorType,
				'获取交易回执失败',
				error
			)
		}
	}

	/**
	 * 等待交易确认
	 */
	async waitForTransaction(
		txHash: string,
		confirmations: number = 1
	): Promise<ethers.TransactionReceipt | null> {
		try {
			const provider = this.getCurrentProvider()
			return await provider.waitForTransaction(txHash, confirmations)
		} catch (error) {
			throw new BlockchainError(
				'NETWORK_ERROR' as BlockchainErrorType,
				'等待交易确认失败',
				error
			)
		}
	}

	/**
	 * 获取合约实例
	 */
	getContract(address: string, abi: any[]): ethers.Contract {
		if (!ethers.isAddress(address)) {
			throw new BlockchainError(
				'INVALID_ADDRESS' as BlockchainErrorType,
				'无效的合约地址'
			)
		}

		const provider = this.getCurrentProvider()
		return new ethers.Contract(address, abi, provider)
	}

	/**
	 * 检查连接状态
	 */
	isProviderConnected(): boolean {
		return this.isConnected && this.provider !== null
	}

	/**
	 * 等待初始化完成
	 */
	async waitForInitialization(): Promise<void> {
		if (this.initializationPromise) {
			await this.initializationPromise
		}
	}

	/**
	 * 重新连接
	 */
	async reconnect(): Promise<void> {
		this.isConnected = false
		this.provider = null
		this.initializationPromise = this.initializeProvider()
		await this.initializationPromise
	}

	/**
	 * 获取NFT
	 */
	async getNfts(address: string): Promise<UserNFT[]> {
		const network = 'eth-sepolia'
		const apiKey = '02b0923c2cb8420f991d9b232bea0b35'
		if (!apiKey) throw new Error('Alchemy API key not configured')
		if (!network) throw new Error('Unsupported network')

		// const url = `https://${network}.g.alchemy.com/nft/v3/${apiKey}/getNFTs`

		try {
			const response = await fetch(
				`https://api.chainbase.online/v1/account/nfts?chain_id=11155111&address=${address}&page=1&limit=100`,
				{
					method: 'GET',
					headers: {
						accept: 'application/json',
						'x-api-key': '32Vheule5iRuLab4mBJhBnmctWi'
					}
				}
			)
			const data = await response.json()

			if (data.error) {
				throw new Error(data.error.message)
			}

			return (data && data.ownedNfts.map(nftToStandardFormat)) || []
		} catch (err) {
			console.error('Failed to fetch NFTs:', err)
			throw err
		}
	}
}

// 导出单例实例
export const blockchainService = new BlockchainService()
