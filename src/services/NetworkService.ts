import { ethers } from 'ethers'

import { SEPOLIA_CONFIG } from '~config/networks'
import type { NetworkConfig } from '~types/wallet'

/**
 * 网络服务 - 处理区块链网络连接和查询
 */
export class NetworkService {
	private static provider: ethers.JsonRpcProvider | null = null

	/**
	 * 获取当前网络配置
	 */
	static getCurrentNetwork(): NetworkConfig {
		return SEPOLIA_CONFIG
	}

	/**
	 * 获取或创建 RPC 提供者
	 */
	static getProvider(): ethers.JsonRpcProvider {
		if (!this.provider) {
			this.provider = new ethers.JsonRpcProvider(SEPOLIA_CONFIG.rpcUrl)
		}
		return this.provider
	}

	/**
	 * 测试网络连接
	 */
	static async testConnection(): Promise<boolean> {
		try {
			const provider = this.getProvider()
			const network = await provider.getNetwork()

			// 验证链 ID 是否匹配
			const chainId = Number(network.chainId)
			const expectedChainId = SEPOLIA_CONFIG.chainId

			console.log(
				`网络连接测试 - 当前链 ID: ${chainId}, 期望链 ID: ${expectedChainId}`
			)

			return chainId === expectedChainId
		} catch (error) {
			console.error('网络连接测试失败:', error)
			return false
		}
	}

	/**
	 * 获取账户余额
	 * @param address 以太坊地址
	 * @returns 余额（以 ETH 为单位的字符串）
	 */
	static async getBalance(address: string): Promise<string> {
		try {
			console.log(`查询地址余额: ${address}`)

			const provider = this.getProvider()
			const balanceWei = await provider.getBalance(address)

			// 将 Wei 转换为 ETH
			const balanceEth = ethers.formatEther(balanceWei)

			console.log(`余额查询成功: ${balanceEth} ETH`)
			return balanceEth
		} catch (error) {
			console.error('余额查询失败:', error)
			throw new Error(`余额查询失败: ${error.message}`)
		}
	}

	/**
	 * 获取网络状态信息
	 */
	static async getNetworkInfo(): Promise<{
		chainId: number
		blockNumber: number
		gasPrice: string
		isConnected: boolean
	}> {
		try {
			const provider = this.getProvider()

			const [network, blockNumber, gasPrice] = await Promise.all([
				provider.getNetwork(),
				provider.getBlockNumber(),
				provider.getFeeData()
			])

			return {
				chainId: Number(network.chainId),
				blockNumber,
				gasPrice: ethers.formatUnits(gasPrice.gasPrice || 0, 'gwei'),
				isConnected: true
			}
		} catch (error) {
			console.error('获取网络信息失败:', error)
			return {
				chainId: 0,
				blockNumber: 0,
				gasPrice: '0',
				isConnected: false
			}
		}
	}

	/**
	 * 获取交易数量（nonce）
	 */
	static async getTransactionCount(address: string): Promise<number> {
		try {
			const provider = this.getProvider()
			return await provider.getTransactionCount(address)
		} catch (error) {
			console.error('获取交易数量失败:', error)
			throw new Error(`获取交易数量失败: ${error.message}`)
		}
	}

	/**
	 * 获取当前 Gas 价格
	 */
	static async getGasPrice(): Promise<string> {
		try {
			const provider = this.getProvider()
			const feeData = await provider.getFeeData()
			return ethers.formatUnits(feeData.gasPrice || 0, 'gwei')
		} catch (error) {
			console.error('获取 Gas 价格失败:', error)
			throw new Error(`获取 Gas 价格失败: ${error.message}`)
		}
	}

	/**
	 * 验证地址是否为合约地址
	 */
	static async isContract(address: string): Promise<boolean> {
		try {
			const provider = this.getProvider()
			const code = await provider.getCode(address)
			return code !== '0x'
		} catch (error) {
			console.error('检查合约地址失败:', error)
			return false
		}
	}

	/**
	 * 格式化余额显示
	 */
	static formatBalance(balance: string, decimals: number = 4): string {
		const num = parseFloat(balance)
		if (num === 0) return '0'
		if (num < 0.0001) return '< 0.0001'
		return num.toFixed(decimals)
	}

	/**
	 * 重置提供者连接（用于网络切换或错误恢复）
	 */
	static resetProvider(): void {
		this.provider = null
	}

	/**
	 * 获取区块浏览器链接
	 */
	static getExplorerUrl(
		type: 'address' | 'tx' | 'block',
		value: string
	): string {
		const baseUrl = SEPOLIA_CONFIG.blockExplorerUrl
		return `${baseUrl}/${type}/${value}`
	}
}
