import { CryptoService } from "./CryptoService"
import { StorageService } from "./StorageService"
import type { WalletAccount } from "~types/wallet"

/**
 * 账户管理服务
 * 处理钱包账户的创建、管理和存储
 */
export class AccountService {
  /**
   * 从解密的钱包数据创建账户对象
   */
  static createAccountFromData(
    address: string,
    privateKey: string,
    mnemonic?: string,
    index: number = 0
  ): WalletAccount {
    return {
      address,
      name: `账户 ${index + 1}`,
      index,
      createdAt: new Date()
    }
  }

  /**
   * 验证账户地址是否有效
   */
  static validateAccount(account: WalletAccount): boolean {
    try {
      // 验证地址格式
      if (!CryptoService.validateAddress(account.address)) {
        return false
      }

      // 验证必要字段
      if (!account.name || account.index < 0) {
        return false
      }

      return true
    } catch (error) {
      console.error("验证账户失败:", error)
      return false
    }
  }

  /**
   * 格式化地址显示
   */
  static formatAddress(address: string, length: number = 6): string {
    if (!address || address.length < 10) {
      return address
    }
    return `${address.slice(0, length)}...${address.slice(-4)}`
  }

  /**
   * 复制地址到剪贴板
   */
  static async copyAddressToClipboard(address: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(address)
      return true
    } catch (error) {
      console.error("复制地址失败:", error)
      return false
    }
  }

  /**
   * 获取区块浏览器链接
   */
  static getExplorerLink(address: string, baseUrl: string): string {
    return `${baseUrl}/address/${address}`
  }

  /**
   * 生成账户的显示名称
   */
  static generateAccountName(index: number): string {
    return `账户 ${index + 1}`
  }

  /**
   * 验证私钥是否对应指定地址
   */
  static validatePrivateKeyForAddress(privateKey: string, expectedAddress: string): boolean {
    try {
      const derivedAddress = CryptoService.privateKeyToAddress(privateKey)
      return derivedAddress.toLowerCase() === expectedAddress.toLowerCase()
    } catch (error) {
      console.error("验证私钥和地址匹配失败:", error)
      return false
    }
  }

  /**
   * 从助记词派生多个账户
   */
  static deriveAccountsFromMnemonic(
    mnemonic: string,
    count: number = 1,
    startIndex: number = 0
  ): { address: string; privateKey: string; index: number }[] {
    const accounts = []
    
    for (let i = 0; i < count; i++) {
      const index = startIndex + i
      try {
        const privateKey = CryptoService.derivePrivateKeyFromMnemonic(mnemonic, undefined, index)
        const address = CryptoService.privateKeyToAddress(privateKey)
        
        accounts.push({
          address,
          privateKey,
          index
        })
      } catch (error) {
        console.error(`派生账户 ${index} 失败:`, error)
        break
      }
    }
    
    return accounts
  }

  /**
   * 检查地址是否已存在于账户列表中
   */
  static isAddressExists(address: string, accounts: WalletAccount[]): boolean {
    return accounts.some(account => 
      account.address.toLowerCase() === address.toLowerCase()
    )
  }
}