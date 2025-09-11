// 钱包相关类型定义
export interface WalletAccount {
	address: string
	name: string
	index: number
	createdAt: Date
}

export interface EncryptedData {
	data: string
	salt: string
	iv: string
}

export interface EncryptedWalletData {
	version: string
	encryptedMnemonic?: EncryptedData
	encryptedAccounts: EncryptedData[]
	salt: string
	iv: string
}

export interface NetworkConfig {
	name: string
	chainId: number
	rpcUrl: string
	blockExplorerUrl: string
	nativeCurrency: {
		name: string
		symbol: string
		decimals: number
	}
}

export enum WalletErrorType {
	INVALID_MNEMONIC = 'INVALID_MNEMONIC',
	INVALID_PRIVATE_KEY = 'INVALID_PRIVATE_KEY',
	WRONG_PASSWORD = 'WRONG_PASSWORD',
	STORAGE_ERROR = 'STORAGE_ERROR',
	NETWORK_ERROR = 'NETWORK_ERROR',
	ACCOUNT_EXISTS = 'ACCOUNT_EXISTS'
}

export class WalletError extends Error {
	constructor(
		public type: WalletErrorType,
		message: string,
		public details?: any
	) {
		super(message)
		this.name = 'WalletError'
	}
}

export enum WalletState {
	UNINITIALIZED = 'UNINITIALIZED',
	LOCKED = 'LOCKED',
	UNLOCKED = 'UNLOCKED'
}
