
// Chrome 扩展存储服务
export class StorageService {
  private static readonly WALLET_INITIALIZED_KEY = "walletInitialized"
  private static readonly WALLET_DATA_KEY = "walletData"

  /**
   * 检查 Chrome 存储 API 是否可用
   */
  private static isStorageAvailable(): boolean {
    try {
      return !!(typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local)
    } catch (error) {
      console.error("Chrome 存储 API 不可用:", error)
      return false
    }
  }

  /**
   * 检查钱包是否已初始化
   */
  static async isWalletInitialized(): Promise<boolean> {
    try {
      if (!this.isStorageAvailable()) {
        console.error("Chrome 存储 API 不可用")
        return false
      }

      const result = await chrome.storage.local.get([
        this.WALLET_INITIALIZED_KEY,
        this.WALLET_DATA_KEY
      ])

      // 检查是否有初始化标识和钱包数据
      const hasInitFlag = result[this.WALLET_INITIALIZED_KEY] === true
      const hasWalletData = result[this.WALLET_DATA_KEY] != null

      return hasInitFlag && hasWalletData
    } catch (error) {
      console.error("检查钱包初始化状态失败:", error)
      return false
    }
  }

  /**
   * 设置钱包初始化状态
   */
  static async setWalletInitialized(initialized: boolean): Promise<void> {
    try {
      if (!this.isStorageAvailable()) {
        throw new Error("Chrome 存储 API 不可用，请确保在扩展环境中运行")
      }

      await chrome.storage.local.set({
        [this.WALLET_INITIALIZED_KEY]: initialized
      })
    } catch (error) {
      console.error("设置钱包初始化状态失败:", error)
      throw error
    }
  }

  /**
   * 保存钱包数据（测试用）
   */
  static async saveTestData(data: any): Promise<void> {
    try {
      if (!this.isStorageAvailable()) {
        throw new Error("Chrome 存储 API 不可用，请确保在扩展环境中运行")
      }

      await chrome.storage.local.set({
        [this.WALLET_DATA_KEY]: data,
        testTimestamp: Date.now()
      })
    } catch (error) {
      console.error("保存测试数据失败:", error)
      throw error
    }
  }

  /**
   * 获取钱包数据（测试用）
   */
  static async getTestData(): Promise<any> {
    try {
      if (!this.isStorageAvailable()) {
        console.error("Chrome 存储 API 不可用")
        return null
      }

      const result = await chrome.storage.local.get([
        this.WALLET_DATA_KEY,
        "testTimestamp"
      ])
      return {
        data: result[this.WALLET_DATA_KEY],
        timestamp: result.testTimestamp
      }
    } catch (error) {
      console.error("获取测试数据失败:", error)
      return null
    }
  }

  /**
   * 清除所有钱包数据
   */
  /**
   * 保存加密的钱包数据
   */
  static async saveEncryptedWallet(encryptedMnemonic: any, encryptedPrivateKey: any): Promise<void> {
    try {
      if (!this.isStorageAvailable()) {
        throw new Error("Chrome 存储 API 不可用，请确保在扩展环境中运行")
      }

      console.log('开始保存加密钱包数据...')
      console.log('Chrome 存储 API 状态:', {
        chrome: typeof chrome,
        storage: typeof chrome?.storage,
        local: typeof chrome?.storage?.local
      })

      const walletData = {
        version: '1.0',
        encryptedMnemonic,
        encryptedPrivateKey,
        createdAt: Date.now()
      }
      
      console.log('准备保存的数据结构:', {
        version: walletData.version,
        hasEncryptedMnemonic: !!walletData.encryptedMnemonic,
        hasEncryptedPrivateKey: !!walletData.encryptedPrivateKey,
        createdAt: walletData.createdAt
      })

      await chrome.storage.local.set({
        [this.WALLET_DATA_KEY]: walletData,
        [this.WALLET_INITIALIZED_KEY]: true
      })
      
      console.log('加密钱包数据保存成功')
    } catch (error) {
      console.error('保存加密钱包数据失败:', error)
      console.error('错误详情:', {
        message: error.message,
        stack: error.stack,
        chrome: typeof chrome,
        storage: typeof chrome?.storage,
        local: typeof chrome?.storage?.local
      })
      throw new Error(`钱包数据保存失败: ${error.message}`)
    }
  }

  /**
   * 获取加密的钱包数据
   */
  static async getEncryptedWallet(): Promise<any> {
    try {
      if (!this.isStorageAvailable()) {
        throw new Error("Chrome 存储 API 不可用，请确保在扩展环境中运行")
      }

      const result = await chrome.storage.local.get([this.WALLET_DATA_KEY])
      return result[this.WALLET_DATA_KEY] || null
    } catch (error) {
      console.error('获取加密钱包数据失败:', error)
      throw error
    }
  }

  /**
   * 获取当前钱包的所有账户地址
   */
  static async getWalletAddresses(): Promise<string[]> {
    try {
      if (!this.isStorageAvailable()) {
        console.error("Chrome 存储 API 不可用")
        return []
      }

      const walletData = await this.getEncryptedWallet()
      if (!walletData) {
        return []
      }

      // 当前实现只有一个账户，返回空数组表示需要通过解密获取
      // 在实际多账户实现中，这里应该返回所有账户地址
      return []
    } catch (error) {
      console.error('获取钱包地址失败:', error)
      return []
    }
  }

  static async clearWalletData(): Promise<void> {
    try {
      if (!this.isStorageAvailable()) {
        throw new Error("Chrome 存储 API 不可用，请确保在扩展环境中运行")
      }

      await chrome.storage.local.clear()
    } catch (error) {
      console.error("清除钱包数据失败:", error)
      throw error
    }
  }
}
