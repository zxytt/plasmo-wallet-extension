// 区块链相关类型定义

export interface NetworkConfig {
	chainId: number
	name: string
	rpcUrl: string
	blockExplorerUrl: string
	nativeCurrency: {
		name: string
		symbol: string
		decimals: number
	}
}

export interface TransactionRequest {
	to: string
	value?: string
	data?: string
	gasLimit?: string
	gasPrice?: string
	maxFeePerGas?: string
	maxPriorityFeePerGas?: string
}

export interface TransactionRecord {
	hash: string
	from: string
	to: string
	value: string
	gasUsed: string
	gasPrice: string
	status: 'pending' | 'success' | 'failed'
	timestamp: number
	type: 'eth' | 'erc20' | 'erc721' | 'erc1155'
	blockNumber?: number
}

export interface GasPriceData {
	slow: string
	standard: string
	fast: string
	estimatedTime: {
		slow: number
		standard: number
		fast: number
	}
}

// 区块链错误类型
export enum BlockchainErrorType {
	NETWORK_ERROR = 'NETWORK_ERROR',
	INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
	INVALID_ADDRESS = 'INVALID_ADDRESS',
	INVALID_AMOUNT = 'INVALID_AMOUNT',
	GAS_ESTIMATION_FAILED = 'GAS_ESTIMATION_FAILED',
	TRANSACTION_FAILED = 'TRANSACTION_FAILED',
	CONTRACT_ERROR = 'CONTRACT_ERROR',
	USER_REJECTED = 'USER_REJECTED',
	PROVIDER_NOT_CONNECTED = 'PROVIDER_NOT_CONNECTED'
}

export class BlockchainError extends Error {
	constructor(
		public type: BlockchainErrorType,
		message: string,
		public details?: any
	) {
		super(message)
		this.name = 'BlockchainError'
	}
}

export interface UserNFT {
	tokenId: string
	contract: string
	name: string
	description: string
	image: string
	collection: string
	chainId: number
	tokenType: string
}
