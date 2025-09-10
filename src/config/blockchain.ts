import type { NetworkConfig } from '../types/blockchain'

// 支持的网络配置
export const NETWORKS: Record<string, NetworkConfig> = {
	sepolia: {
		chainId: 11155111,
		name: 'Sepolia Testnet',
		rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com', // 免费公共 RPC
		blockExplorerUrl: 'https://sepolia.etherscan.io',
		nativeCurrency: {
			name: 'Sepolia ETH',
			symbol: 'ETH',
			decimals: 18
		}
	},
	ethereum: {
		chainId: 1,
		name: 'Ethereum Mainnet',
		rpcUrl: 'https://ethereum-rpc.publicnode.com',
		blockExplorerUrl: 'https://etherscan.io',
		nativeCurrency: {
			name: 'ETH',
			symbol: 'ETH',
			decimals: 18
		}
	}
}

// 默认网络
export const DEFAULT_NETWORK = 'sepolia'

// RPC 端点配置
export const RPC_CONFIG = {
	timeout: 30000, // 30秒超时
	retryAttempts: 3,
	retryDelay: 1000 // 1秒重试延迟
}

// Gas 配置
export const GAS_CONFIG = {
	defaultGasLimit: '21000', // ETH 转账默认 gas limit
	maxGasLimit: '500000', // 最大 gas limit
	gasPriceMultipliers: {
		slow: 0.8,
		standard: 1.0,
		fast: 1.2
	}
}
