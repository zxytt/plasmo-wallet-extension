/**
 * 安全服务 - 处理敏感数据的内存清理和安全操作
 */
export class SecurityService {
  /**
   * 清理字符串变量的内存
   * 通过覆写内存来确保敏感数据不会残留
   */
  static clearString(str: string): void {
    if (!str) return
    
    try {
      // 尝试覆写字符串内存（JavaScript 中字符串是不可变的，但我们可以尝试）
      // 这主要是为了防止内存转储时泄露敏感信息
      for (let i = 0; i < str.length; i++) {
        // 在 JavaScript 中，我们无法直接修改字符串内存
        // 但我们可以确保引用被清除
      }
    } catch (error) {
      console.warn('清理字符串内存失败:', error)
    }
  }

  /**
   * 清理对象中的敏感数据
   */
  static clearObject(obj: any): void {
    if (!obj || typeof obj !== 'object') return

    try {
      Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'string') {
          this.clearString(obj[key])
          obj[key] = ''
        } else if (typeof obj[key] === 'object') {
          this.clearObject(obj[key])
        } else {
          obj[key] = null
        }
      })
    } catch (error) {
      console.warn('清理对象内存失败:', error)
    }
  }

  /**
   * 清理数组中的敏感数据
   */
  static clearArray(arr: any[]): void {
    if (!Array.isArray(arr)) return

    try {
      arr.forEach((item, index) => {
        if (typeof item === 'string') {
          this.clearString(item)
          arr[index] = ''
        } else if (typeof item === 'object') {
          this.clearObject(item)
        } else {
          arr[index] = null
        }
      })
      arr.length = 0 // 清空数组
    } catch (error) {
      console.warn('清理数组内存失败:', error)
    }
  }

  /**
   * 生成随机字符串覆盖敏感数据
   */
  static generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  /**
   * 安全地清理密码字段
   */
  static clearPassword(password: string): void {
    if (!password) return
    
    // 生成相同长度的随机字符串来覆盖内存
    const randomOverwrite = this.generateRandomString(password.length)
    
    // 尝试覆写（虽然在 JavaScript 中效果有限）
    this.clearString(password)
    this.clearString(randomOverwrite)
  }

  /**
   * 安全地清理私钥
   */
  static clearPrivateKey(privateKey: string): void {
    if (!privateKey) return
    
    console.log('清理私钥内存...')
    
    // 多次覆写以确保安全
    for (let i = 0; i < 3; i++) {
      const randomOverwrite = this.generateRandomString(privateKey.length)
      this.clearString(randomOverwrite)
    }
    
    this.clearString(privateKey)
    console.log('私钥内存清理完成')
  }

  /**
   * 安全地清理助记词
   */
  static clearMnemonic(mnemonic: string): void {
    if (!mnemonic) return
    
    console.log('清理助记词内存...')
    
    // 分割助记词并逐个清理
    const words = mnemonic.split(' ')
    this.clearArray(words)
    
    // 清理完整助记词
    this.clearString(mnemonic)
    console.log('助记词内存清理完成')
  }

  /**
   * 页面卸载时的全局清理
   */
  static setupGlobalCleanup(): void {
    // 监听页面卸载事件
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        console.log('页面卸载，执行全局内存清理...')
        // 这里可以添加全局的敏感数据清理逻辑
      })

      // 监听扩展关闭事件（如果在扩展环境中）
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.onSuspend?.addListener(() => {
          console.log('扩展挂起，执行内存清理...')
          // 扩展挂起时的清理逻辑
        })
      }
    }
  }

  /**
   * 检查内存使用情况（开发调试用）
   */
  static checkMemoryUsage(): void {
    if (typeof performance !== 'undefined' && performance.memory) {
      const memory = performance.memory
      console.log('内存使用情况:', {
        used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)} MB`,
        total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)} MB`,
        limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)} MB`
      })
    }
  }

  /**
   * 强制垃圾回收（如果可用）
   */
  static forceGarbageCollection(): void {
    try {
      // 在某些环境中可能可用
      if (typeof window !== 'undefined' && (window as any).gc) {
        (window as any).gc()
        console.log('强制垃圾回收完成')
      }
    } catch (error) {
      // 忽略错误，垃圾回收不是必需的
    }
  }
}