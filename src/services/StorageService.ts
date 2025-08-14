/*
 * @Author: big-bamp 1528912119@qq.com
 * @Date: 2025-08-14 17:16:55
 * @LastEditors: big-bamp 1528912119@qq.com
 * @LastEditTime: 2025-08-14 17:31:58
 * @FilePath: /wallet/src/services/StorageService.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// Chrome 扩展存储服务
export class StorageService {
  private static readonly WALLET_INITIALIZED_KEY = "walletInitialized"
  private static readonly WALLET_DATA_KEY = "walletData"

  /**
   * 检查钱包是否已初始化
   */
  static async isWalletInitialized(): Promise<boolean> {
    try {
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
      const walletData = {
        version: '1.0',
        encryptedMnemonic,
        encryptedPrivateKey,
        createdAt: Date.now()
      }
      
      await chrome.storage.local.set({
        [this.WALLET_DATA_KEY]: walletData,
        [this.WALLET_INITIALIZED_KEY]: true
      })
      
      console.log('加密钱包数据保存成功')
    } catch (error) {
      console.error('保存加密钱包数据失败:', error)
      throw error
    }
  }

  /**
   * 获取加密的钱包数据
   */
  static async getEncryptedWallet(): Promise<any> {
    try {
      const result = await chrome.storage.local.get([this.WALLET_DATA_KEY])
      return result[this.WALLET_DATA_KEY] || null
    } catch (error) {
      console.error('获取加密钱包数据失败:', error)
      throw error
    }
  }

  static async clearWalletData(): Promise<void> {
    try {
      await chrome.storage.local.clear()
    } catch (error) {
      console.error("清除钱包数据失败:", error)
      throw error
    }
  }
}
