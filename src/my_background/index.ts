import { ethers } from 'ethers'

import { blockchainService } from '~services/BlockchainService'
import { StorageService } from '~services/StorageService'
import { transactionMonitorService } from '~services/TransactionMonitorService'
import { transactionSyncService } from '~services/TransactionSyncService'
import type { TransactionRecord } from '~types/blockchain'

console.log('background service')
// 后台服务类
class BackgroundService {
	private isRunning = false
	private accounts: string[] = []
	private notificationIdCounter = 0

	constructor() {
		this.initialize()
	}

	// 初始化后台服务
	async initialize() {
		// try {
		console.log('钱包扩展后台服务初始化...')

		// 初始化区块链服务
		await blockchainService.initializeProvider()

		// 初始化交易监控服务
		await this.initializeTransactionMonitoring()

		// 加载账户信息
		await this.loadAccounts()

		// 设置消息监听
		this.setupMessageListeners()

		this.isRunning = true
		console.log('钱包扩展后台服务初始化完成')
		// } catch (error) {
		// 	console.error('后台服务初始化失败:', error)
		// }
	}

	// 初始化交易监控
	private async initializeTransactionMonitoring() {
		// try {
		// 启动交易监控服务（每10秒检查一次）
		transactionMonitorService.startMonitoring(10000)

		// 监听交易状态变化
		transactionMonitorService.onTransactionStatusChange(
			(transaction: TransactionRecord, oldStatus: string) => {
				console.log(
					`交易状态变化: ${transaction.hash} ${oldStatus} -> ${transaction.status}`
				)

				// 当交易状态变为成功时发送通知
				if (transaction.status === 'success') {
					this.showTransactionNotification(transaction)
				}
			}
		)
		// } catch (error) {
		// 	console.error('交易监控初始化失败:', error)
		// }
	}

	// 加载账户信息
	private async loadAccounts() {
		try {
			// 从存储中获取账户信息
			const currentAccount =
				await StorageService.getItem<string>('currentAccount')
			if (currentAccount) {
				this.accounts = [currentAccount]
				console.log('加载账户成功:', currentAccount)
			}
		} catch (error) {
			console.error('加载账户信息失败:', error)
		}
	}

	// 设置消息监听
	private setupMessageListeners() {
		// 监听来自内容脚本的消息
		chrome.runtime.onMessage.addListener(
			(message, sender, sendResponse) => {
				console.log(
					'收到来自内容脚本的消息:',
					message,
					'来源:',
					sender.tab?.url
				)

				// 处理不同类型的消息
				switch (message.type) {
					case 'INITIALIZE_DAPP_CONNECTION':
						this.handleDappConnectionInit(message, sendResponse)
						return true // 表示异步回复
					case 'REQUEST_ACCOUNTS':
						this.handleRequestAccounts(message, sendResponse)
						return true
					case 'SEND_TRANSACTION':
						this.handleSendTransaction(message, sendResponse)
						return true
					case 'SIGN_MESSAGE':
						this.handleSignMessage(message, sendResponse)
						return true
					case 'GET_CONNECTION_STATUS':
						this.handleGetConnectionStatus(message, sendResponse)
						return true
					case 'CHECK_BACKGROUND_STATUS':
						sendResponse({
							status: 'running',
							timestamp: new Date().toISOString()
						})
						true
					default:
						console.warn('未知的消息类型:', message.type)
						sendResponse({
							success: false,
							error: '未知的消息类型'
						})
				}

				return false
			}
		)

		// 监听来自popup的消息
		chrome.runtime.onConnect.addListener((port) => {
			if (port.name === 'walletPopup') {
				console.log('Popup已连接到后台服务')

				// 发送当前状态给popup
				port.postMessage({
					type: 'BACKGROUND_STATUS',
					data: {
						isRunning: this.isRunning,
						accounts: this.accounts,
						connectedDapps: this.getConnectedDapps()
					}
				})

				// 监听来自popup的消息
				port.onMessage.addListener((message) => {
					console.log('收到来自Popup的消息:', message)

					switch (message.type) {
						case 'ACCOUNT_CHANGED':
							this.accounts = message.data.accounts || []
							console.log('账户已更新:', this.accounts)
							break
						case 'NETWORK_CHANGED':
							console.log('网络已更新:', message.data.network)
							this.notifyContentScripts(
								'NETWORK_CHANGED',
								message.data
							)
							break
						case 'DISCONNECT_ALL_DAPPS':
							this.disconnectAllDapps()
							break
					}
				})

				// 监听连接断开
				port.onDisconnect.addListener(() => {
					console.log('Popup已断开连接')
				})
			}
		})
	}

	// 处理Dapp连接初始化
	private async handleDappConnectionInit(
		message: any,
		sendResponse: Function
	) {
		try {
			const dappOrigin = message.origin || 'unknown'
			console.log(`Dapp连接初始化来自: ${dappOrigin}`)

			// 记录Dapp连接
			this.saveDappConnection(dappOrigin)

			sendResponse({
				success: true,
				data: {
					chainId: blockchainService.getCurrentNetwork().chainId,
					isConnected: this.accounts.length > 0
				}
			})
		} catch (error) {
			console.error('处理Dapp连接初始化失败:', error)
			sendResponse({
				success: false,
				error: (error as Error).message
			})
		}
	}

	// 处理账户请求
	private async handleRequestAccounts(message: any, sendResponse: Function) {
		try {
			console.log('收到账户请求')

			// 检查是否有账户
			if (this.accounts.length === 0) {
				// 请求用户授权访问钱包
				this.showAuthNotification(message.origin)

				sendResponse({
					success: false,
					error: '请先解锁钱包'
				})
				return
			}

			// 返回账户列表
			sendResponse({
				success: true,
				accounts: this.accounts
			})
		} catch (error) {
			console.error('处理账户请求失败:', error)
			sendResponse({
				success: false,
				error: (error as Error).message
			})
		}
	}

	// 处理交易发送
	private async handleSendTransaction(message: any, sendResponse: Function) {
		try {
			const transaction = message.transaction
			const dappOrigin = message.origin

			console.log(`收到来自${dappOrigin}的交易请求:`, transaction)

			// 验证交易参数
			if (!transaction.to || !transaction.value) {
				throw new Error('交易参数不完整')
			}

			// 显示交易确认通知
			this.showTransactionConfirmation(
				transaction,
				dappOrigin,
				sendResponse
			)

			// 注意：这里不立即发送响应，而是在用户确认或拒绝后发送
		} catch (error) {
			console.error('处理交易请求失败:', error)
			sendResponse({
				success: false,
				error: (error as Error).message
			})
		}
	}

	// 处理消息签名
	private async handleSignMessage(message: any, sendResponse: Function) {
		try {
			const messageToSign = message.message
			const dappOrigin = message.origin

			console.log(`收到来自${dappOrigin}的签名请求:`, messageToSign)

			// 显示签名确认通知
			this.showSignConfirmation(messageToSign, dappOrigin, sendResponse)

			// 注意：这里不立即发送响应，而是在用户确认或拒绝后发送
		} catch (error) {
			console.error('处理签名请求失败:', error)
			sendResponse({
				success: false,
				error: (error as Error).message
			})
		}
	}

	// 处理连接状态请求
	private handleGetConnectionStatus(message: any, sendResponse: Function) {
		try {
			sendResponse({
				success: true,
				data: {
					isRunning: this.isRunning,
					accounts: this.accounts,
					chainId: blockchainService.getCurrentNetwork().chainId
				}
			})
		} catch (error) {
			console.error('获取连接状态失败:', error)
			sendResponse({
				success: false,
				error: (error as Error).message
			})
		}
	}

	// 显示授权通知
	private showAuthNotification(dappOrigin: string) {
		const notificationId = `auth-${this.notificationIdCounter++}`

		chrome.notifications.create(notificationId, {
			type: 'basic',
			iconUrl: 'gen-assets/icon128.plasmo.png',
			title: '钱包授权请求',
			message: `${new URL(dappOrigin).hostname} 请求访问您的钱包`,
			buttons: [{ title: '授权' }, { title: '拒绝' }],
			priority: 1
		})

		// 监听通知按钮点击
		chrome.notifications.onButtonClicked.addListener((id, index) => {
			if (id === notificationId) {
				if (index === 0) {
					// 授权，打开钱包popup让用户解锁
					chrome.action.openPopup()
				}
			}
		})
	}

	// 显示交易确认通知
	private showTransactionConfirmation(
		transaction: any,
		dappOrigin: string,
		sendResponse: Function
	) {
		const notificationId = `tx-${this.notificationIdCounter++}`
		const amount = ethers.formatEther(transaction.value || '0')
		const target = transaction.to.substring(0, 8) + '...'

		chrome.notifications.create(notificationId, {
			type: 'basic',
			iconUrl: 'gen-assets/icon128.plasmo.png',
			title: '交易确认',
			message: `${new URL(dappOrigin).hostname} 请求发送 ${amount} ETH 到 ${target}`,
			buttons: [{ title: '确认' }, { title: '拒绝' }],
			priority: 1
		})

		// 监听通知按钮点击
		chrome.notifications.onButtonClicked.addListener((id, index) => {
			if (id === notificationId) {
				if (index === 0) {
					// 打开popup进行交易确认
					chrome.action.openPopup()
					// 存储待处理交易信息
					StorageService.setItem('pendingTransaction', {
						transaction,
						dappOrigin,
						sendResponse
					})
				} else {
					// 拒绝交易
					sendResponse({
						success: false,
						error: '用户拒绝了交易'
					})
				}
			}
		})
	}

	// 显示签名确认通知
	private showSignConfirmation(
		message: string,
		dappOrigin: string,
		sendResponse: Function
	) {
		const notificationId = `sign-${this.notificationIdCounter++}`
		const displayMessage =
			message.length > 50 ? message.substring(0, 50) + '...' : message

		chrome.notifications.create(notificationId, {
			type: 'basic',
			iconUrl: 'gen-assets/icon128.plasmo.png',
			title: '签名确认',
			message: `${new URL(dappOrigin).hostname} 请求签名消息: ${displayMessage}`,
			buttons: [{ title: '确认' }, { title: '拒绝' }],
			priority: 1
		})

		// 监听通知按钮点击
		chrome.notifications.onButtonClicked.addListener((id, index) => {
			if (id === notificationId) {
				if (index === 0) {
					// 打开popup进行签名确认
					chrome.action.openPopup()
					// 存储待处理签名信息
					StorageService.setItem('pendingSignMessage', {
						message,
						dappOrigin,
						sendResponse
					})
				} else {
					// 拒绝签名
					sendResponse({
						success: false,
						error: '用户拒绝了签名'
					})
				}
			}
		})
	}

	// 显示交易完成通知
	private showTransactionNotification(transaction: TransactionRecord) {
		const notificationId = `tx-complete-${transaction.hash.substring(0, 8)}`
		const amount = ethers.formatEther(transaction.value)

		chrome.notifications.create(notificationId, {
			type: 'basic',
			iconUrl: 'gen-assets/icon128.plasmo.png',
			title: '交易已确认',
			message: `您的 ${amount} ETH 交易已成功确认`,
			buttons: [{ title: '查看详情' }],
			priority: 1
		})

		// 监听通知按钮点击
		chrome.notifications.onButtonClicked.addListener((id) => {
			if (id === notificationId) {
				// 打开区块浏览器查看交易详情
				const explorerUrl = `${blockchainService.getCurrentNetwork().blockExplorerUrl}/tx/${transaction.hash}`
				chrome.tabs.create({ url: explorerUrl })
			}
		})
	}

	// 保存Dapp连接信息
	private async saveDappConnection(origin: string) {
		try {
			const connections =
				(await StorageService.getItem<string[]>('dappConnections')) ||
				[]
			if (!connections.includes(origin)) {
				connections.push(origin)
				await StorageService.setItem('dappConnections', connections)
			}
		} catch (error) {
			console.error('保存Dapp连接信息失败:', error)
		}
	}

	// 获取已连接的Dapp列表
	private async getConnectedDapps(): Promise<string[]> {
		try {
			return (
				(await StorageService.getItem<string[]>('dappConnections')) ||
				[]
			)
		} catch (error) {
			console.error('获取Dapp连接列表失败:', error)
			return []
		}
	}

	// 断开所有Dapp连接
	private async disconnectAllDapps() {
		try {
			await StorageService.removeItem('dappConnections')
			this.notifyContentScripts('DISCONNECT_ALL_DAPPS')
			console.log('已断开所有Dapp连接')
		} catch (error) {
			console.error('断开Dapp连接失败:', error)
		}
	}

	// 通知所有内容脚本
	private notifyContentScripts(type: string, data: any = {}) {
		chrome.tabs.query({}, (tabs) => {
			tabs.forEach((tab) => {
				if (tab.id) {
					chrome.tabs.sendMessage(
						tab.id,
						{
							type,
							data
						},
						() => {
							// 忽略错误，因为可能有些标签页没有内容脚本
							if (chrome.runtime.lastError) {
								// console.log('发送消息到标签页失败:', chrome.runtime.lastError.message)
							}
						}
					)
				}
			})
		})
	}

	// 获取服务状态
	getStatus() {
		return {
			isRunning: this.isRunning,
			accounts: this.accounts,
			network: blockchainService.getCurrentNetwork()
		}
	}
}

// 创建并初始化后台服务实例
const backgroundService = new BackgroundService()

// 导出后台服务实例供其他模块使用
export default backgroundService

// 导出服务状态获取方法
export const getBackgroundServiceStatus = () => {
	return backgroundService.getStatus()
}
