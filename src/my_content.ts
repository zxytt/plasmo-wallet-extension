import type { PlasmoCSConfig } from 'plasmo'

// 配置内容脚本匹配所有URL
export const config: PlasmoCSConfig = {
	matches: ['<all_urls>']
}

console.log('DappContentScript loaded')

/**
 * DappContentScript类负责处理Dapp连接功能
 * 它会在页面中注入模拟的window.ethereum provider
 */
class DappContentScript {
	// 保存事件监听器
	private eventListeners: Map<string, Function[]> = new Map()
	// 保存当前页面的连接状态
	private connectionState: 'disconnected' | 'connected' = 'disconnected'
	// 保存当前页面的Dapp ID
	private currentDappId: string | null = null

	constructor() {
		this.initialize()
	}

	/**
	 * 初始化内容脚本
	 */
	private initialize(): void {
		console.log('钱包扩展：初始化内容脚本')
		// 检查是否已经注入过provider
		if ((window as any).ethereum) {
			console.log('钱包扩展：已检测到现有ethereum provider')
			return
		}

		// 生成Dapp ID（基于URL）
		this.currentDappId = this.generateDappId()

		// 注入模拟的ethereum provider
		this.injectEthereumProvider()

		// 监听来自后台的消息
		this.setupMessageListener()
	}

	/**
	 * 生成基于当前页面URL的Dapp ID
	 */
	private generateDappId(): string {
		const origin = window.location.origin
		const host = window.location.hostname
		return `dapp_${btoa(origin).slice(0, 12)}`
	}

	/**
	 * 注入模拟的ethereum provider到window对象
	 */
	private injectEthereumProvider(): void {
		const ethereumProvider = {
			// 基础信息
			isMetaMask: false,
			isConnected: () => this.connectionState === 'connected',
			chainId: '0x1', // 默认主网
			networkVersion: '1',
			selectedAddress: null,
			providers: undefined,
			_metamask: {},

			// 事件监听
			on: this.on.bind(this),
			addListener: this.on.bind(this),
			removeListener: this.removeListener.bind(this),
			removeAllListeners: this.removeAllListeners.bind(this),
			emit: this.emit.bind(this),

			// RPC方法
			request: this.request.bind(this),
			send: this.send.bind(this),
			sendAsync: this.sendAsync.bind(this)
		}

		// 设置为只读属性
		Object.defineProperty(window, 'ethereum', {
			value: ethereumProvider,
			writable: false,
			enumerable: true,
			configurable: true
		})

		console.log('钱包扩展：已成功注入ethereum provider')

		// 发送Dapp连接初始化消息到后台
		this.sendMessageToBackground({
			type: 'INITIALIZE_DAPP_CONNECTION',
			dappId: this.currentDappId,
			origin: window.location.origin,
			hostname: window.location.hostname
		})
	}

	/**
	 * 设置消息监听器，接收来自后台的消息
	 */
	private setupMessageListener(): void {
		window.addEventListener('message', (event) => {
			// 只处理来自扩展后台的消息
			if (
				event.source !== window ||
				!event.data.from ||
				event.data.from !== 'plasmo-wallet-background'
			) {
				return
			}

			const { type, data } = event.data

			switch (type) {
				case 'ACCOUNT_CHANGED':
					this.handleAccountChanged(data)
					break
				case 'NETWORK_CHANGED':
					this.handleNetworkChanged(data)
					break
				case 'CONNECTION_STATUS_CHANGED':
					this.handleConnectionStatusChanged(data)
					break
				case 'TRANSACTION_RESPONSE':
				case 'SIGN_RESPONSE':
				case 'SWITCH_CHAIN_RESPONSE':
				case 'ADD_CHAIN_RESPONSE':
					this.handleProviderResponse(type, data)
					break
			}
		})
	}

	/**
	 * 向后台发送消息
	 */
	private sendMessageToBackground(message: any): void {
		chrome.runtime.sendMessage({
			...message,
			from: 'plasmo-wallet-content',
			dappId: this.currentDappId
		})
	}

	/**
	 * 处理账户变更
	 */
	private handleAccountChanged(data: any): void {
		const ethereum = (window as any).ethereum
		if (ethereum) {
			ethereum.selectedAddress = data.address || null
			this.emit('accountsChanged', data.address ? [data.address] : [])
		}
	}

	/**
	 * 处理网络变更
	 */
	private handleNetworkChanged(data: any): void {
		const ethereum = (window as any).ethereum
		if (ethereum && data.chainId !== ethereum.chainId) {
			ethereum.chainId = data.chainId
			ethereum.networkVersion = parseInt(data.chainId, 16).toString()
			this.emit('chainChanged', data.chainId)
		}
	}

	/**
	 * 处理连接状态变更
	 */
	private handleConnectionStatusChanged(data: any): void {
		this.connectionState = data.isConnected ? 'connected' : 'disconnected'
		this.emit('connect', { chainId: (window as any).ethereum?.chainId })
	}

	/**
	 * 处理来自后台的provider响应
	 */
	private handleProviderResponse(type: string, data: any): void {
		const requestId = data.requestId
		if (requestId) {
			// 查找对应的请求回调
			const callbackKey = `callback_${requestId}`
			const callback = sessionStorage.getItem(callbackKey)

			if (callback) {
				try {
					const callbackFn = new Function(`return ${callback}`)()
					if (data.error) {
						callbackFn(data.error)
					} else {
						callbackFn(null, data.result)
					}
				} catch (error) {
					console.error('处理响应回调失败:', error)
				}

				// 删除已处理的回调
				sessionStorage.removeItem(callbackKey)
			}
		}
	}

	// 事件系统实现
	private on(event: string, listener: Function): void {
		if (!this.eventListeners.has(event)) {
			this.eventListeners.set(event, [])
		}
		this.eventListeners.get(event)?.push(listener)
	}

	private removeListener(event: string, listener: Function): void {
		const listeners = this.eventListeners.get(event)
		if (listeners) {
			const index = listeners.indexOf(listener)
			if (index > -1) {
				listeners.splice(index, 1)
			}
		}
	}

	private removeAllListeners(event?: string): void {
		if (event) {
			this.eventListeners.delete(event)
		} else {
			this.eventListeners.clear()
		}
	}

	private emit(event: string, ...args: any[]): void {
		const listeners = this.eventListeners.get(event)
		if (listeners) {
			listeners.forEach((listener) => {
				try {
					listener(...args)
				} catch (error) {
					console.error(`事件监听器错误 (${event}):`, error)
				}
			})
		}
	}

	// RPC方法实现
	private async request(args: any): Promise<any> {
		if (typeof args === 'string') {
			return this.send(args)
		}

		const { method, params } = args

		switch (method) {
			case 'eth_requestAccounts':
				return this.requestAccounts()
			case 'eth_sendTransaction':
				return this.sendTransaction(params[0])
			case 'personal_sign':
				return this.signMessage(params)
			case 'wallet_switchEthereumChain':
				return this.switchChain(params[0])
			case 'wallet_addEthereumChain':
				return this.addChain(params[0])
			case 'eth_accounts':
				return this.getAccounts()
			case 'eth_chainId':
				return Promise.resolve(
					(window as any).ethereum?.chainId || '0x1'
				)
			default:
				return this.send(method, params)
		}
	}

	private send(method: string, params?: any[]): Promise<any> {
		return new Promise((resolve, reject) => {
			this.sendAsync({ method, params }, (error: any, response: any) => {
				if (error) {
					reject(error)
				} else {
					resolve(response?.result)
				}
			})
		})
	}

	private sendAsync(payload: any, callback: Function): void {
		// 生成请求ID
		const requestId = Date.now() + Math.floor(Math.random() * 1000)

		// 保存回调到sessionStorage
		sessionStorage.setItem(`callback_${requestId}`, callback.toString())

		// 发送请求到后台
		this.sendMessageToBackground({
			type: 'RPC_REQUEST',
			requestId,
			payload
		})
	}

	// 具体功能实现
	private async requestAccounts(): Promise<string[]> {
		return new Promise((resolve, reject) => {
			const requestId = Date.now()

			sessionStorage.setItem(`callback_${requestId}`, resolve.toString())

			this.sendMessageToBackground({
				type: 'REQUEST_ACCOUNTS',
				requestId,
				dappInfo: {
					id: this.currentDappId,
					origin: window.location.origin,
					hostname: window.location.hostname,
					name: document.title
				}
			})
		})
	}

	private getAccounts(): Promise<string[]> {
		const ethereum = (window as any).ethereum
		return Promise.resolve(
			ethereum?.selectedAddress ? [ethereum.selectedAddress] : []
		)
	}

	private sendTransaction(transaction: any): Promise<string> {
		return new Promise((resolve, reject) => {
			const requestId = Date.now()

			sessionStorage.setItem(`callback_${requestId}`, resolve.toString())

			this.sendMessageToBackground({
				type: 'SEND_TRANSACTION',
				requestId,
				transaction,
				dappId: this.currentDappId
			})
		})
	}

	private signMessage(params: any[]): Promise<string> {
		return new Promise((resolve, reject) => {
			const requestId = Date.now()

			sessionStorage.setItem(`callback_${requestId}`, resolve.toString())

			this.sendMessageToBackground({
				type: 'SIGN_MESSAGE',
				requestId,
				message: params[0],
				address: params[1],
				dappId: this.currentDappId
			})
		})
	}

	private switchChain(params: any): Promise<void> {
		return new Promise((resolve, reject) => {
			const requestId = Date.now()

			sessionStorage.setItem(`callback_${requestId}`, resolve.toString())

			this.sendMessageToBackground({
				type: 'SWITCH_CHAIN',
				requestId,
				chainId: params.chainId,
				dappId: this.currentDappId
			})
		})
	}

	private addChain(params: any): Promise<void> {
		return new Promise((resolve, reject) => {
			const requestId = Date.now()

			sessionStorage.setItem(`callback_${requestId}`, resolve.toString())

			this.sendMessageToBackground({
				type: 'ADD_CHAIN',
				requestId,
				chainConfig: params,
				dappId: this.currentDappId
			})
		})
	}
}

// 创建内容脚本实例
new DappContentScript()
