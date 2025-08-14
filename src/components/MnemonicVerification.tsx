import React, { useState, useEffect } from "react"
import { Button } from "./Button"
import { CryptoService } from "~services/CryptoService"

interface MnemonicVerificationProps {
  originalMnemonic: string
  onVerificationSuccess: () => void
  onBack?: () => void
}

export function MnemonicVerification({ 
  originalMnemonic, 
  onVerificationSuccess, 
  onBack 
}: MnemonicVerificationProps) {
  const [inputWords, setInputWords] = useState<string[]>(Array(12).fill(''))
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [verificationError, setVerificationError] = useState<string>('')
  const [isVerifying, setIsVerifying] = useState(false)

  // 随机选择需要验证的单词位置（选择3-4个）
  const [wordsToVerify, setWordsToVerify] = useState<number[]>([])
  const originalWords = CryptoService.mnemonicToWords(originalMnemonic)

  useEffect(() => {
    // 随机选择4个位置进行验证
    const positions = []
    while (positions.length < 4) {
      const randomIndex = Math.floor(Math.random() * 12)
      if (!positions.includes(randomIndex)) {
        positions.push(randomIndex)
      }
    }
    setWordsToVerify(positions.sort((a, b) => a - b))
  }, [])

  const handleWordInput = (index: number, value: string) => {
    const newInputWords = [...inputWords]
    newInputWords[index] = value.toLowerCase().trim()
    setInputWords(newInputWords)
    setVerificationError('')
  }

  const handleVerification = () => {
    setIsVerifying(true)
    setVerificationError('')

    try {
      // 检查选中的单词是否正确
      let isValid = true
      const errors = []

      for (const index of wordsToVerify) {
        const inputWord = inputWords[index]
        const originalWord = originalWords[index]
        
        if (!inputWord) {
          errors.push(`请输入第 ${index + 1} 个单词`)
          isValid = false
        } else if (inputWord !== originalWord) {
          errors.push(`第 ${index + 1} 个单词不正确`)
          isValid = false
        }
      }

      if (!isValid) {
        setVerificationError(errors.join('，'))
        setIsVerifying(false)
        return
      }

      // 验证成功
      setTimeout(() => {
        setIsVerifying(false)
        onVerificationSuccess()
      }, 1000)

    } catch (error) {
      setVerificationError('验证过程中出现错误，请重试')
      setIsVerifying(false)
    }
  }

  const handleClearAll = () => {
    setInputWords(Array(12).fill(''))
    setVerificationError('')
  }

  const getInputStatus = (index: number) => {
    if (!wordsToVerify.includes(index)) {
      return 'disabled'
    }
    
    if (verificationError && inputWords[index]) {
      const originalWord = originalWords[index]
      return inputWords[index] === originalWord ? 'correct' : 'error'
    }
    
    return inputWords[index] ? 'filled' : 'empty'
  }

  const getInputClassName = (index: number) => {
    const status = getInputStatus(index)
    const baseClasses = "w-full p-3 text-center border rounded-lg text-sm font-medium"
    
    switch (status) {
      case 'disabled':
        return `${baseClasses} bg-gray-100 text-gray-400 cursor-not-allowed`
      case 'correct':
        return `${baseClasses} bg-green-50 border-green-300 text-green-800`
      case 'error':
        return `${baseClasses} bg-red-50 border-red-300 text-red-800`
      case 'filled':
        return `${baseClasses} bg-blue-50 border-blue-300 text-blue-800`
      default:
        return `${baseClasses} bg-white border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent`
    }
  }

  const canVerify = wordsToVerify.every(index => inputWords[index].trim() !== '')

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-4xl mb-3">✅</div>
        <h2 className="text-2xl font-bold text-gray-800">验证助记词</h2>
        <p className="text-gray-600 mt-2">
          请输入下面高亮位置的单词来验证您已正确保存助记词
        </p>
      </div>

      {/* 验证说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <span className="text-blue-600">ℹ️</span>
          <div className="text-blue-800 text-sm">
            <div className="font-medium mb-1">验证说明:</div>
            <div>请在高亮的输入框中输入对应位置的助记词单词，灰色区域无需填写</div>
          </div>
        </div>
      </div>

      {/* 助记词输入网格 */}
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 12 }, (_, index) => (
            <div key={index} className="space-y-1">
              <div className="text-xs text-gray-500 text-center">
                {index + 1}
                {wordsToVerify.includes(index) && (
                  <span className="text-blue-600 ml-1">*</span>
                )}
              </div>
              <input
                type="text"
                value={inputWords[index]}
                onChange={(e) => handleWordInput(index, e.target.value)}
                disabled={!wordsToVerify.includes(index)}
                placeholder={wordsToVerify.includes(index) ? "输入单词" : "●●●●"}
                className={getInputClassName(index)}
                autoComplete="off"
                spellCheck="false"
              />
            </div>
          ))}
        </div>

        {/* 错误提示 */}
        {verificationError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <span className="text-red-600">❌</span>
              <span className="text-red-800 text-sm">{verificationError}</span>
            </div>
          </div>
        )}

        {/* 验证成功提示 */}
        {isVerifying && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <span className="text-green-600">⏳</span>
              <span className="text-green-800 text-sm">验证中...</span>
            </div>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="space-y-3">
        <div className="flex space-x-3">
          <Button
            onClick={handleVerification}
            disabled={!canVerify || isVerifying}
            className="flex-1"
          >
            {isVerifying ? '验证中...' : '验证助记词'}
          </Button>
          <Button
            onClick={handleClearAll}
            variant="secondary"
            className="px-6"
          >
            清空
          </Button>
        </div>
        
        {onBack && (
          <Button onClick={onBack} variant="secondary" className="w-full">
            ← 返回查看助记词
          </Button>
        )}
      </div>
    </div>
  )
}