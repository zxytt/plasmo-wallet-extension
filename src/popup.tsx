import React, { useState, useEffect } from "react"
import { Layout } from "~components/Layout"
import { Button } from "~components/Button"
import { MnemonicDisplay } from "~components/MnemonicDisplay"
import { MnemonicVerification } from "~components/MnemonicVerification"
import { PasswordSetup } from "~components/PasswordSetup"
import { WalletCreated } from "~components/WalletCreated"
import { UnlockWallet } from "~components/UnlockWallet"
import { ImportPrivateKey } from "~components/ImportPrivateKey"
import { WalletTabs } from "~components/WalletTabs"
import { StorageService } from "~services/StorageService"
import { CryptoService } from "~services/CryptoService"
import { SecurityService } from "~services/SecurityService"
import { initTheme } from "~utils/theme"

import "~style.css"

type Screen = 'welcome' | 'create' | 'mnemonic' | 'verify' | 'password' | 'success' | 'import' | 'import-password' | 'main' | 'unlock'

function IndexPopup() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome')
  const [isWalletInitialized, setIsWalletInitialized] = useState<boolean | null>(null)
  const [testData, setTestData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generatedMnemonic, setGeneratedMnemonic] = useState<string>('')
  const [derivedAddress, setDerivedAddress] = useState<string>('')
  const [derivedPrivateKey, setDerivedPrivateKey] = useState<string>('')

  // 检查钱包初始化状态
  useEffect(() => {
    checkWalletStatus()
    
    // 初始化主题系统
    const cleanupTheme = initTheme()
    
    // 设置全局内存清理
    SecurityService.setupGlobalCleanup()
    
    // 返回清理函数
    return () => {
      if (cleanupTheme) {
        cleanupTheme()
      }
    }
  }, [])

  // 组件卸载时清理所有敏感数据
  useEffect(() => {
    return () => {
      console.log('Popup 组件卸载，清理敏感数据...')
      
      // 清理助记词
      if (generatedMnemonic) {
        SecurityService.clearMnemonic(generatedMnemonic)
      }
      
      // 清理私钥
      if (derivedPrivateKey) {
        SecurityService.clearPrivateKey(derivedPrivateKey)
      }
      
      // 强制垃圾回收
      SecurityService.forceGarbageCollection()
    }
  }, [])

  const checkWalletStatus = async () => {
    try {
      setLoading(true)

      // 检查钱包初始化状态
      const initialized = await StorageService.isWalletInitialized()
      setIsWalletInitialized(initialized)

      // 加载已保存的测试数据
      const savedData = await StorageService.getTestData()
      if (savedData && savedData.data) {
        setTestData(savedData)
      }

      // 如果已初始化，显示解锁界面；否则显示欢迎界面
      if (initialized) {
        setCurrentScreen('unlock')
      } else {
        setCurrentScreen('welcome')
      }
    } catch (error) {
      console.error('检查钱包状态失败:', error)
      setCurrentScreen('welcome')
    } finally {
      setLoading(false)
    }
  }

  const handleTestStorage = async () => {
    try {
      const testObj = {
        message: '测试数据',
        timestamp: new Date().toISOString(),
        random: Math.random()
      }

      await StorageService.saveTestData(testObj)
      alert('测试数据已保存！')

      // 读取数据验证
      const savedData = await StorageService.getTestData()
      setTestData(savedData)
    } catch (error) {
      alert('存储测试失败: ' + error.message)
    }
  }

  const handleClearData = async () => {
    try {
      await StorageService.clearWalletData()
      setTestData(null)
      setIsWalletInitialized(false)
      setCurrentScreen('welcome')
      alert('数据已清除！')
    } catch (error) {
      alert('清除数据失败: ' + error.message)
    }
  }

  const handleCreateWallet = () => {
    try {
      console.log('开始创建钱包...')

      // 生成助记词
      const mnemonic = CryptoService.generateMnemonic()
      console.log('助记词生成成功:', mnemonic)
      setGeneratedMnemonic(mnemonic)

      // 先测试助记词验证
      const isValid = CryptoService.validateMnemonic(mnemonic)
      console.log('助记词验证结果:', isValid)

      if (!isValid) {
        throw new Error('生成的助记词无效')
      }

      // 派生第一个账户的私钥和地址
      console.log('开始派生私钥...')
      const privateKey = CryptoService.derivePrivateKeyFromMnemonic(mnemonic)
      console.log('私钥派生成功，长度:', privateKey.length)
      setDerivedPrivateKey(privateKey)

      console.log('开始生成地址...')
      const address = CryptoService.privateKeyToAddress(privateKey)
      console.log('地址生成成功:', address)
      setDerivedAddress(address)

      // 切换到助记词显示界面
      setCurrentScreen('mnemonic')
    } catch (error) {
      console.error('创建钱包失败:', error)
      alert('创建钱包失败: ' + error.message)
    }
  }

  const handleMnemonicContinue = () => {
    // 进入助记词验证界面
    setCurrentScreen('verify')
  }

  const handleVerificationSuccess = () => {
    // 验证成功，进入密码设置界面
    setCurrentScreen('password')
  }

  const handlePasswordSet = async (password: string) => {
    try {
      console.log('开始保存加密钱包数据...')
      
      // 加密助记词
      const encryptedMnemonic = CryptoService.encrypt(generatedMnemonic, password)
      console.log('助记词加密成功')
      
      // 加密私钥
      const encryptedPrivateKey = CryptoService.encrypt(derivedPrivateKey, password)
      console.log('私钥加密成功')
      
      // 保存到本地存储
      await StorageService.saveEncryptedWallet(encryptedMnemonic, encryptedPrivateKey)
      console.log('钱包数据保存成功')
      
      // 更新状态
      setIsWalletInitialized(true)
      
      // 显示创建成功界面
      setCurrentScreen('success')
    } catch (error) {
      console.error('保存钱包失败:', error)
      alert('保存钱包失败: ' + error.message)
    }
  }

  const handleWalletCreatedContinue = () => {
    // 钱包创建完成，直接进入主钱包界面
    setCurrentScreen('main')
  }

  const handleUnlock = async (password: string) => {
    try {
      console.log('开始解锁钱包...')
      
      // 获取加密的钱包数据
      const encryptedWallet = await StorageService.getEncryptedWallet()
      if (!encryptedWallet) {
        throw new Error('未找到钱包数据')
      }

      console.log('找到加密钱包数据')

      // 尝试解密助记词来验证密码
      const decryptedMnemonic = CryptoService.decrypt(
        encryptedWallet.encryptedMnemonic.encryptedData,
        password,
        encryptedWallet.encryptedMnemonic.salt,
        encryptedWallet.encryptedMnemonic.iv
      )

      console.log('密码验证成功')

      // 解密私钥
      const decryptedPrivateKey = CryptoService.decrypt(
        encryptedWallet.encryptedPrivateKey.encryptedData,
        password,
        encryptedWallet.encryptedPrivateKey.salt,
        encryptedWallet.encryptedPrivateKey.iv
      )

      // 从私钥生成地址
      const address = CryptoService.privateKeyToAddress(decryptedPrivateKey)
      
      // 更新状态
      setGeneratedMnemonic(decryptedMnemonic)
      setDerivedPrivateKey(decryptedPrivateKey)
      setDerivedAddress(address)

      console.log('钱包解锁成功，地址:', address)

      // 跳转到主界面
      setCurrentScreen('main')
    } catch (error) {
      console.error('解锁钱包失败:', error)
      throw error
    }
  }

  const handleImportSuccess = (privateKey: string, address: string) => {
    // 保存导入的私钥和地址
    setDerivedPrivateKey(privateKey)
    setDerivedAddress(address)
    
    // 生成一个临时助记词（用于显示，实际不会使用）
    setGeneratedMnemonic('导入的私钥账户')
    
    console.log('私钥导入成功，地址:', address)
    
    // 进入密码设置界面
    setCurrentScreen('import-password')
  }

  const handleImportPasswordSet = async (password: string) => {
    try {
      console.log('开始保存导入的钱包数据...')
      
      // 加密私钥
      const encryptedPrivateKey = CryptoService.encrypt(derivedPrivateKey, password)
      console.log('私钥加密成功')
      
      // 创建一个空的助记词加密数据（因为是私钥导入）
      const emptyMnemonicEncrypted = CryptoService.encrypt('', password)
      
      // 保存到本地存储
      await StorageService.saveEncryptedWallet(emptyMnemonicEncrypted, encryptedPrivateKey)
      console.log('导入钱包数据保存成功')
      
      // 更新状态
      setIsWalletInitialized(true)
      
      // 显示创建成功界面
      setCurrentScreen('success')
    } catch (error) {
      console.error('保存导入钱包失败:', error)
      alert('保存钱包失败: ' + error.message)
    }
  }

  const renderScreen = () => {
    if (loading) {
      return (
        <div className="text-center space-y-4">
          <div className="text-4xl">⏳</div>
          <h2 className="text-xl font-semibold text-gray-800">检查钱包状态...</h2>
          <div className="animate-pulse bg-gray-200 h-2 rounded"></div>
        </div>
      )
    }

    switch (currentScreen) {
      case 'unlock':
        return (
          <UnlockWallet
            onUnlock={handleUnlock}
            onBackToWelcome={() => setCurrentScreen('welcome')}
          />
        )

      case 'welcome':
        return (
          <div className="text-center space-y-6">
            <div className="space-y-4">
              <div className="text-6xl mb-4">🚀</div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                欢迎使用钱包
              </h1>
              <p className="text-gray-600 text-lg">
                安全的 Sepolia 测试网钱包
              </p>
            </div>

            {/* 钱包状态显示 */}
            <div className="bg-white/70 rounded-lg p-4 space-y-2">
              <div className="text-sm font-medium text-gray-700">钱包状态</div>
              <div className="flex items-center justify-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${isWalletInitialized ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className="text-sm text-gray-600">
                  {isWalletInitialized ? '已初始化' : '未初始化'}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => setCurrentScreen('create')}
                className="w-full text-lg py-4"
              >
                🆕 创建新钱包
              </Button>
              <Button
                onClick={() => setCurrentScreen('import')}
                variant="secondary"
                className="w-full text-lg py-4"
              >
                📥 导入现有钱包
              </Button>
            </div>

            {/* 存储测试功能 */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="text-sm font-medium text-gray-700">存储测试</div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handleTestStorage}
                  variant="secondary"
                  className="text-sm py-2"
                >
                  测试存储
                </Button>
                <Button
                  onClick={handleClearData}
                  variant="danger"
                  className="text-sm py-2"
                >
                  清除数据
                </Button>
              </div>
              <Button
                onClick={checkWalletStatus}
                variant="secondary"
                className="w-full text-sm py-2"
              >
                🔄 刷新数据
              </Button>
              {testData ? (
                <div className="text-xs text-gray-600 bg-white p-3 rounded border">
                  <div className="font-medium text-green-600 mb-1">✅ 已保存数据:</div>
                  <div>消息: {testData.data?.message}</div>
                  <div>随机数: {testData.data?.random?.toFixed(4)}</div>
                  <div>保存时间: {new Date(testData.timestamp).toLocaleString()}</div>
                </div>
              ) : (
                <div className="text-xs text-gray-500 bg-gray-100 p-3 rounded border">
                  📭 暂无保存的测试数据
                </div>
              )}

              {/* 显示最后生成的地址 */}
              {derivedAddress && (
                <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded border">
                  <div className="font-medium text-blue-600 mb-1">🔑 最后生成的地址:</div>
                  <div className="font-mono break-all">{derivedAddress}</div>
                </div>
              )}
            </div>

            <div className="bg-white/50 rounded-lg p-4">
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex items-center justify-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Sepolia 测试网络</span>
                </div>
                <div className="text-xs text-gray-500">版本 0.0.1</div>
              </div>
            </div>
          </div>
        )

      case 'create':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-4xl mb-3">🆕</div>
              <h2 className="text-2xl font-bold text-gray-800">创建新钱包</h2>
              <p className="text-gray-600 mt-2">
                我们将为您生成一个新的助记词来创建钱包
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <span className="text-blue-600">ℹ️</span>
                <div className="text-blue-800 text-sm space-y-1">
                  <div className="font-medium">创建钱包将会:</div>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>生成12个单词的助记词</li>
                    <li>创建您的第一个以太坊账户</li>
                    <li>连接到Sepolia测试网络</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleCreateWallet}
                className="w-full text-lg py-4"
              >
                🎲 生成助记词
              </Button>
              <Button
                onClick={() => setCurrentScreen('welcome')}
                variant="secondary"
                className="w-full"
              >
                ← 返回
              </Button>
            </div>
          </div>
        )

      case 'mnemonic':
        return (
          <MnemonicDisplay
            mnemonic={generatedMnemonic}
            onContinue={handleMnemonicContinue}
            onBack={() => setCurrentScreen('create')}
          />
        )

      case 'verify':
        return (
          <MnemonicVerification
            originalMnemonic={generatedMnemonic}
            onVerificationSuccess={handleVerificationSuccess}
            onBack={() => setCurrentScreen('mnemonic')}
          />
        )

      case 'password':
        return (
          <PasswordSetup
            onPasswordSet={handlePasswordSet}
            onBack={() => setCurrentScreen('verify')}
          />
        )

      case 'success':
        return (
          <WalletCreated
            walletAddress={derivedAddress}
            onContinue={handleWalletCreatedContinue}
          />
        )

      case 'main':
        return (
          <WalletTabs
            currentAccount={{
              address: derivedAddress,
              privateKey: derivedPrivateKey,
              mnemonic: generatedMnemonic
            }}
            onLockWallet={() => {
              console.log('锁定钱包，清理敏感数据...')
              
              // 安全清理敏感数据
              if (generatedMnemonic) {
                SecurityService.clearMnemonic(generatedMnemonic)
              }
              if (derivedPrivateKey) {
                SecurityService.clearPrivateKey(derivedPrivateKey)
              }
              
              // 清除状态并锁定钱包
              setGeneratedMnemonic('')
              setDerivedPrivateKey('')
              setDerivedAddress('')
              setCurrentScreen('unlock')
              
              // 强制垃圾回收
              SecurityService.forceGarbageCollection()
            }}
          />
        )

      case 'import':
        return (
          <ImportPrivateKey
            onImportSuccess={handleImportSuccess}
            onBack={() => setCurrentScreen('welcome')}
            currentWalletAddress={derivedAddress}
          />
        )

      case 'import-password':
        return (
          <PasswordSetup
            onPasswordSet={handleImportPasswordSet}
            onBack={() => setCurrentScreen('import')}
          />
        )

      default:
        return <div>未知页面</div>
    }
  }

  return (
    <Layout title="Sepolia Wallet">
      {renderScreen()}
    </Layout>
  )
}

export default IndexPopup