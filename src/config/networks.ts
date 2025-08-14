import type { NetworkConfig } from "~types/wallet"

// Sepolia 测试网络配置
export const SEPOLIA_CONFIG: NetworkConfig = {
  name: 'Sepolia Testnet',
  chainId: 11155111,
  rpcUrl: 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161', // 公共端点
  blockExplorerUrl: 'https://sepolia.etherscan.io',
  nativeCurrency: {
    name: 'Sepolia Ether',
    symbol: 'ETH',
    decimals: 18
  }
}

export const DEFAULT_NETWORK = SEPOLIA_CONFIG