import type { WalletAccount } from '~types/wallet'
import { CryptoService } from './CryptoService'
import { StorageService } from './StorageService'

/**
 * 账户管理服务
 * 处理钱包账户的创建、管理和存储
 */
export class AccountService {
  // 静态变量，用于存储账户列表
  private static accounts: WalletAccount[] = []
  private static accountIndex: number = 0
  private static mnemonic: string = ''
  // 存储键名常量
  private static readonly ACCOUNTS_STORAGE_KEY = 'walletAccounts'
  private static readonly MNEMONIC_STORAGE_KEY = 'walletMnemonic'
  private static readonly ACCOUNT_INDEX_STORAGE_KEY = 'walletAccountIndex'

  // 初始化账户服务，从存储中加载账户信息
  static async initialize(): Promise<void> {
    try {
      // 从存储中加载账户信息
      const storedAccounts = await StorageService.getItem<WalletAccount[]>(this.ACCOUNTS_STORAGE_KEY)
      const storedMnemonic = await StorageService.getItem<string>(this.MNEMONIC_STORAGE_KEY)
      const storedIndex = await StorageService.getItem<number>(this.ACCOUNT_INDEX_STORAGE_KEY)
      console.log('storedAccounts', storedAccounts)
      console.log('storedMnemonic', storedMnemonic)
      console.log('storedIndex', storedIndex)

      if (storedAccounts && Array.isArray(storedAccounts)) {
        this.accounts = storedAccounts
      }
      if (storedMnemonic) {
        this.mnemonic = storedMnemonic
      }
      if (storedIndex !== null && storedIndex !== undefined) {
        this.accountIndex = storedIndex
      }
    } catch (error) {
      console.error('初始化账户服务失败:', error)
      // 如果加载失败，使用默认值
      this.accounts = []
      this.accountIndex = 0
      this.mnemonic = ''
    }
  }

  /**
   * 从解密的钱包数据创建账户对象
   */
  static async createAccountFromData(
    address: string,
    privateKey: string,
    mnemonic?: string
  ) {
    const account = {
      address,
      name: `账户 ${this.accountIndex + 1}`,
      index: this.accountIndex,
      createdAt: new Date()
    }

    console.log('助记词', mnemonic)
    if (!this.mnemonic && mnemonic) {
      this.mnemonic = mnemonic
    }
    
    this.accountIndex++
    this.accounts.push(account)
    
    // 将账户信息保存到Chrome本地存储
    await this.saveAccountsToStorage()
    
    console.log('创建账户成功', account, this.accounts, this.accountIndex, this.mnemonic)
    return account
  }

  /**
   * 将账户信息保存到Chrome本地存储
   */
  private static async saveAccountsToStorage(): Promise<void> {
    try {
      // 保存账户列表，但不包含敏感信息（私钥和助记词）
      const accountsToStore = this.accounts.map(account => ({
        address: account.address,
        name: account.name,
        index: account.index,
        createdAt: account.createdAt
      }))
      
      // 分别保存账户列表、助记词和账户索引
      await Promise.all([
        StorageService.setItem(this.ACCOUNTS_STORAGE_KEY, accountsToStore),
        StorageService.setItem(this.MNEMONIC_STORAGE_KEY, this.mnemonic),
        StorageService.setItem(this.ACCOUNT_INDEX_STORAGE_KEY, this.accountIndex)
      ])
      
      console.log('账户信息已成功保存到Chrome存储')
    } catch (error) {
      console.error('保存账户信息到存储失败:', error)
      throw error
    }
  }

  /**
   * 获取所有账户
   */
  static getAccounts(): WalletAccount[] {
    return [...this.accounts]
  }

  /**
   * 获取助记词
   */
  static getMnemonic(): string {
    return this.mnemonic
  }

  /**
   * 获取账户索引
   */
  static getAccountIndex(): number {
    return this.accountIndex
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
      console.error('验证账户失败:', error)
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
      console.error('复制地址失败:', error)
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
  static validatePrivateKeyForAddress(
    privateKey: string,
    expectedAddress: string
  ): boolean {
    try {
      const derivedAddress = CryptoService.privateKeyToAddress(privateKey)
      return (
        derivedAddress.toLowerCase() === expectedAddress.toLowerCase()
      )
    } catch (error) {
      console.error('验证私钥和地址匹配失败:', error)
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
        const privateKey = CryptoService.derivePrivateKeyFromMnemonic(
          mnemonic,
          undefined,
          index
        )
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
  static isAddressExists(
    address: string,
    accounts: WalletAccount[]
  ): boolean {
    return accounts.some(
      (account) => account.address.toLowerCase() === address.toLowerCase()
    )
  }
}
