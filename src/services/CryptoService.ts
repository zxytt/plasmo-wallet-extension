import * as bip39 from 'bip39'
import * as CryptoJS from 'crypto-js'
import * as ethers from 'ethers'

/**
 * 加密服务 - 处理助记词生成、验证和密钥派生
 */
export class CryptoService {
	/**
	 * 生成 BIP39 助记词（12个单词）
	 */
	static generateMnemonic(): string {
		try {
			// 生成 128 位熵，对应 12 个单词
			const mnemonic = bip39.generateMnemonic(128)
			return mnemonic
		} catch (error) {
			console.error('生成助记词失败:', error)
			throw new Error('助记词生成失败')
		}
	}

	/**
	 * 验证助记词是否有效
	 */
	static validateMnemonic(mnemonic: string): boolean {
		try {
			return bip39.validateMnemonic(mnemonic.trim())
		} catch (error) {
			console.error('验证助记词失败:', error)
			return false
		}
	}

	/**
	 * 将助记词转换为种子
	 */
	static mnemonicToSeed(mnemonic: string, password?: string): Buffer {
		try {
			return bip39.mnemonicToSeedSync(mnemonic, password)
		} catch (error) {
			console.error('助记词转种子失败:', error)
			throw new Error('助记词转换失败')
		}
	}

	/**
	 * 从助记词派生私钥（使用 BIP44 路径）
	 * 路径: m/44'/60'/0'/0/0 (以太坊第一个账户)
	 * @param mnemonic 助记词
	 * @param passphrase BIP39 密码短语（可选，用于增强安全性）
	 * @param index 账户索引
	 */
	static derivePrivateKeyFromMnemonic(
		mnemonic: string,
		passphrase?: string,
		index: number = 0
	): string {
		try {
			console.log('开始派生私钥，助记词长度:', mnemonic.split(' ').length)

			// 检查 ethers 是否正确导入
			console.log('ethers 对象检查:', {
				ethers: typeof ethers,
				keys: Object.keys(ethers),
				Mnemonic: typeof ethers.Mnemonic,
				HDNodeWallet: typeof ethers.HDNodeWallet
			})

			// 创建 Mnemonic 对象，如果有 passphrase 则使用
			console.log(
				'创建 Mnemonic 对象，passphrase:',
				passphrase ? '已设置' : '未设置'
			)
			const mnemonicObj = ethers.Mnemonic.fromPhrase(mnemonic, passphrase)

			// 使用 HDNodeWallet 派生密钥
			// 直接在 fromMnemonic 中指定完整路径
			const path = `m/44'/60'/0'/0/${index}`
			console.log('使用路径:', path)

			const derivedWallet = ethers.HDNodeWallet.fromMnemonic(
				mnemonicObj,
				path
			)
			console.log('私钥派生成功，地址:', derivedWallet.address)

			return derivedWallet.privateKey
		} catch (error) {
			console.error('派生私钥失败:', error)
			console.error('助记词:', mnemonic)
			console.error('错误详情:', error)
			throw new Error('私钥派生失败: ' + error.message)
		}
	}

	/**
	 * 从私钥生成以太坊地址
	 */
	static privateKeyToAddress(privateKey: string): string {
		try {
			const wallet = new ethers.Wallet(privateKey)
			return wallet.address
		} catch (error) {
			console.error('私钥转地址失败:', error)
			throw new Error('地址生成失败')
		}
	}

	/**
	 * 验证私钥格式是否正确
	 */
	static validatePrivateKey(privateKey: string): boolean {
		try {
			// 移除可能的 0x 前缀
			const cleanKey = privateKey.startsWith('0x')
				? privateKey.slice(2)
				: privateKey

			// 检查长度（64个十六进制字符）
			if (cleanKey.length !== 64) {
				return false
			}

			// 检查是否为有效的十六进制
			if (!/^[0-9a-fA-F]+$/.test(cleanKey)) {
				return false
			}

			// 尝试创建钱包来验证
			new ethers.Wallet('0x' + cleanKey)
			return true
		} catch (error) {
			return false
		}
	}

	/**
	 * 验证以太坊地址格式
	 */
	static validateAddress(address: string): boolean {
		try {
			return ethers.isAddress(address)
		} catch (error) {
			return false
		}
	}

	/**
	 * 格式化助记词（确保单词间只有一个空格）
	 */
	static formatMnemonic(mnemonic: string): string {
		return mnemonic.trim().split(/\s+/).join(' ')
	}

	/**
	 * 将助记词分割为单词数组
	 */
	static mnemonicToWords(mnemonic: string): string[] {
		return this.formatMnemonic(mnemonic).split(' ')
	}

	/**
	 * 从单词数组重建助记词
	 */
	static wordsToMnemonic(words: string[]): string {
		return words.join(' ')
	}

	/**
	 * 使用 AES-256 加密数据
	 */
	static encrypt(
		data: string,
		password: string
	): { encryptedData: string; salt: string; iv: string } {
		try {
			// 生成随机盐值
			const salt = CryptoJS.lib.WordArray.random(256 / 8).toString()

			// 使用 PBKDF2 从密码派生密钥
			const key = CryptoJS.PBKDF2(password, salt, {
				keySize: 256 / 32,
				iterations: 100000
			})

			// 生成随机 IV
			const iv = CryptoJS.lib.WordArray.random(128 / 8).toString()

			// 加密数据
			const encrypted = CryptoJS.AES.encrypt(data, key, {
				iv: CryptoJS.enc.Hex.parse(iv),
				mode: CryptoJS.mode.CBC,
				padding: CryptoJS.pad.Pkcs7
			})

			return {
				encryptedData: encrypted.toString(),
				salt: salt,
				iv: iv
			}
		} catch (error) {
			console.error('加密失败:', error)
			throw new Error('数据加密失败')
		}
	}

	/**
	 * 使用 AES-256 解密数据
	 */
	static decrypt(
		encryptedData: string,
		password: string,
		salt: string,
		iv: string
	): string {
		try {
			// 使用相同的参数重新派生密钥
			const key = CryptoJS.PBKDF2(password, salt, {
				keySize: 256 / 32,
				iterations: 100000
			})

			// 解密数据
			const decrypted = CryptoJS.AES.decrypt(encryptedData, key, {
				iv: CryptoJS.enc.Hex.parse(iv),
				mode: CryptoJS.mode.CBC,
				padding: CryptoJS.pad.Pkcs7
			})

			const decryptedText = decrypted.toString(CryptoJS.enc.Utf8)

			if (!decryptedText) {
				throw new Error('解密失败，可能是密码错误')
			}

			return decryptedText
		} catch (error) {
			console.error('解密失败:', error)
			throw new Error('数据解密失败，请检查密码是否正确')
		}
	}

	/**
	 * 验证密码强度
	 */
	static validatePasswordStrength(password: string): {
		isValid: boolean
		message: string
	} {
		if (password.length < 8) {
			return { isValid: false, message: '密码至少需要8个字符' }
		}

		if (password.length > 128) {
			return { isValid: false, message: '密码不能超过128个字符' }
		}

		// 检查是否包含至少一个字母和一个数字
		const hasLetter = /[a-zA-Z]/.test(password)
		const hasNumber = /[0-9]/.test(password)

		if (!hasLetter || !hasNumber) {
			return {
				isValid: false,
				message: '密码应包含至少一个字母和一个数字'
			}
		}

		return { isValid: true, message: '密码强度良好' }
	}
}
