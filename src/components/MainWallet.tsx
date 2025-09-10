import React, { useEffect, useState } from 'react'

import { SEPOLIA_CONFIG } from '~config/networks'
import { AccountService } from '~services/AccountService'
import { blockchainService } from '~services/BlockchainService'
import { NetworkService } from '~services/NetworkService'
import { transactionMonitorService } from '~services/TransactionMonitorService'
import type { WalletAccount } from '~types/wallet'

import { Button } from './Button'
import { SendETH } from './SendETH'
import { TransactionHistory } from './TransactionHistory'

interface MainWalletProps {
	currentNetwork: string
	currentAccount: {
		address: string
		privateKey: string
		mnemonic?: string
	}
}

export function MainWallet({
	currentNetwork,
	currentAccount
}: MainWalletProps) {
	const [copySuccess, setCopySuccess] = useState<string>('')
	const [balance, setBalance] = useState<string>('')
	const [balanceLoading, setBalanceLoading] = useState<boolean>(true)
	const [balanceError, setBalanceError] = useState<string>('')
	const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
	const [autoRefresh, setAutoRefresh] = useState<boolean>(true)
	const [networkInfo, setNetworkInfo] = useState<{
		chainId: number
		name: string
		blockNumber: number
		gasPrice: string
		isConnected: boolean
		blockExplorerUrl: string
		uint: string
	} | null>(null)
	const [showSendETH, setShowSendETH] = useState<boolean>(false)
	const [showTransactionHistory, setShowTransactionHistory] =
		useState<boolean>(false)
	const [lastTransactionHash, setLastTransactionHash] = useState<string>('')
	const [pendingTransactionCount, setPendingTransactionCount] =
		useState<number>(0)

	// 创建账户列表（目前只有一个账户）
	const accounts: WalletAccount[] = [
		{
			address: currentAccount.address,
			name: '账户 1',
			index: 0,
			createdAt: new Date()
		}
	]

	const handleCopyAddress = async (address: string) => {
		const success = await AccountService.copyAddressToClipboard(address)
		if (success) {
			setCopySuccess('地址已复制!')
		} else {
			setCopySuccess('复制失败')
		}
		setTimeout(() => setCopySuccess(''), 2000)
	}

	const formatAddress = (address: string) => {
		return AccountService.formatAddress(address)
	}

	// 加载余额和网络信息
	useEffect(() => {
		loadAccountData()
		initializeTransactionMonitoring()
	}, [currentAccount.address, currentNetwork])

	// 初始化交易监控
	const initializeTransactionMonitoring = () => {
		// 启动交易监控
		transactionMonitorService.startMonitoring(10000) // 每10秒检查一次

		// 监听交易状态变化
		transactionMonitorService.onTransactionStatusChange(
			(transaction, oldStatus) => {
				console.log(
					`交易状态变化: ${transaction.hash} ${oldStatus} -> ${transaction.status}`
				)

				// 更新待确认交易数量
				updatePendingTransactionCount()
			}
		)

		// 监听余额更新需要
		transactionMonitorService.onBalanceUpdateNeeded((transaction) => {
			console.log(`交易确认，需要更新余额: ${transaction.hash}`)

			// 延迟刷新余额，等待区块确认
			setTimeout(() => {
				loadAccountData()
			}, 3000)
		})

		// 初始化待确认交易数量
		updatePendingTransactionCount()
	}

	// 自动刷新余额
	// useEffect(() => {
	// 	if (!autoRefresh) return

	// 	const interval = setInterval(() => {
	// 		if (!balanceLoading) {
	// 			loadAccountData()
	// 		}
	// 	}, 30000) // 每30秒刷新一次

	// 	return () => clearInterval(interval)
	// }, [autoRefresh, balanceLoading, currentAccount.address])

	// 组件卸载时清理敏感数据
	useEffect(() => {
		return () => {
			// 停止交易监控
			transactionMonitorService.stopMonitoring()

			// 清理可能的敏感状态
			setCopySuccess('')
			setBalance('')
			setBalanceError('')
			setLastUpdated(null)
			setAutoRefresh(false)
			setNetworkInfo(null)
			setPendingTransactionCount(0)
		}
	}, [])

	const loadAccountData = async () => {
		try {
			setBalanceLoading(true)
			setBalanceError('')

			// 等待区块链服务初始化
			await blockchainService.waitForInitialization()

			// 检查区块链服务连接状态
			if (!blockchainService.isProviderConnected()) {
				throw new Error('区块链服务未连接')
			}

			// 并行加载余额和网络信息
			const [accountBalance, networkData, blockNumber] =
				await Promise.all([
					// 使用 BlockchainService 查询 ETH 余额
					blockchainService.getETHBalance(currentAccount.address),
					blockchainService.getCurrentNetwork(),
					blockchainService.getCurrentBlockNumber()
				])

			setBalance(accountBalance)
			setNetworkInfo({
				chainId: networkData.chainId,
				name: networkData.name,
				blockNumber: blockNumber,
				gasPrice: '0',
				isConnected: true,
				blockExplorerUrl: networkData.blockExplorerUrl,
				uint: networkData.nativeCurrency.name
			})
			console.log('networkData', networkData)
			setLastUpdated(new Date())
			console.log(`✅ ETH余额查询成功: ${accountBalance} ETH`)
		} catch (error) {
			console.error('加载账户数据失败:', error)
			setBalance('0')
			setBalanceError(error.message || '余额查询失败')
		} finally {
			setBalanceLoading(false)
		}
	}

	const handleRefreshBalance = () => {
		loadAccountData()
	}

	const handleTransactionSent = (txHash: string) => {
		setLastTransactionHash(txHash)

		// 更新待确认交易数量
		updatePendingTransactionCount()

		// 刷新余额（延迟执行，等待交易广播）
		setTimeout(() => {
			loadAccountData()
		}, 2000)
	}

	const updatePendingTransactionCount = async () => {
		try {
			const count =
				await transactionMonitorService.getPendingTransactionCount()
			setPendingTransactionCount(count)
		} catch (error) {
			console.error('更新待确认交易数量失败:', error)
		}
	}

	const handleRefreshTransactionHistory = () => {
		loadAccountData()
		updatePendingTransactionCount()
	}

	return (
		<div className="space-y-6">
			{/* 账户列表 */}
			<div className="space-y-4">
				{accounts.map((account, index) => (
					<div
						key={account.address}
						className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
						{/* 账户名称和索引 */}
						<div className="flex items-center justify-between">
							<div className="flex items-center space-x-2">
								<div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
									<span className="text-blue-600 font-medium text-sm">
										{index + 1}
									</span>
								</div>
								<div>
									<div className="font-medium text-gray-800 pl-3">
										{account.name}
									</div>
									<div className="text-xs text-gray-500">
										<Button
											onClick={() =>
												handleCopyAddress(
													account.address
												)
											}
											size="sm"
											variant="ghost"
											className="text-sm">
											{formatAddress(account.address)}📋
										</Button>
									</div>
								</div>
							</div>
							<div className="text-xs text-gray-400">
								<Button
									onClick={() => {
										const explorerLink =
											AccountService.getExplorerLink(
												account.address,
												networkInfo?.blockExplorerUrl
											)
										window.open(explorerLink, '_blank')
									}}
									variant="secondary"
									className="flex-1 text-sm py-2">
									🔍 查看详情
								</Button>
							</div>
						</div>

						{/* 余额显示 */}
						<div
							className={`rounded-lg p-3 ${
								balanceError
									? 'bg-red-50 border border-red-200'
									: 'bg-blue-50'
							}`}>
							<div className="flex items-center justify-between">
								<div>
									{/* <div
										className={`text-sm font-medium ${
											balanceError
												? 'text-red-800'
												: 'text-blue-800'
										}`}>
										余额
									</div> */}
									<div
										className={`text-sm ${
											balanceError
												? 'text-red-600'
												: 'text-blue-600'
										}`}>
										{networkInfo?.name}
									</div>
								</div>
								<div className="text-right">
									{balanceLoading ? (
										<div>
											<div className="text-lg font-bold text-blue-800">
												<div className="animate-pulse bg-blue-200 h-6 w-16 rounded"></div>
											</div>
											<div className="text-xs text-blue-600 mt-1">
												🔄 查询中...
											</div>
										</div>
									) : balanceError ? (
										<div>
											<div className="text-lg font-bold text-red-800">
												❌ 错误
											</div>
											<div className="text-xs text-red-600 mt-1">
												查询失败
											</div>
										</div>
									) : (
										<div>
											<div className="text-lg font-bold text-blue-800">
												{NetworkService.formatBalance(
													balance
												)}{' '}
												{networkInfo?.uint}
											</div>
										</div>
									)}
								</div>
							</div>

							{/* 错误信息显示 */}
							{balanceError && (
								<div className="mt-2 pt-2 border-t border-red-200">
									<div className="text-xs text-red-700 bg-red-100 rounded p-2">
										⚠️ {balanceError}
									</div>
								</div>
							)}

							{/* 最后更新时间和自动刷新状态 */}
							{/* {lastUpdated &&
								!balanceLoading &&
								!balanceError && (
									<div className="mt-2 pt-2 border-t border-blue-200">
										<div className="flex items-center justify-between text-xs text-blue-600">
											<span>
												最后更新:{' '}
												{lastUpdated.toLocaleTimeString()}
											</span>
											<div className="flex items-center space-x-1">
												{autoRefresh && (
													<span className="flex items-center">
														<div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
														自动刷新
													</span>
												)}
											</div>
										</div>
									</div>
								)} */}

							{/* 刷新按钮 */}
							{/* <div
								className={`mt-2 pt-2 border-t ${
									balanceError
										? 'border-red-200'
										: 'border-blue-200'
								}`}>
								<div className="flex space-x-2">
									<Button
										onClick={handleRefreshBalance}
										variant={
											balanceError
												? 'primary'
												: 'secondary'
										}
										className="flex-1 text-xs py-2"
										disabled={balanceLoading}>
										{balanceLoading
											? '🔄 查询中...'
											: balanceError
												? '🔄 重试'
												: '🔄 手动刷新'}
									</Button>
									<Button
										onClick={() =>
											setAutoRefresh(!autoRefresh)
										}
										variant="secondary"
										className="text-xs py-2 px-3"
										disabled={balanceLoading}>
										{autoRefresh ? '⏸️' : '▶️'}
									</Button>
								</div>
								<div className="text-xs text-gray-500 text-center mt-1">
									自动刷新:{' '}
									{autoRefresh ? '开启 (30秒)' : '关闭'}
								</div>
							</div> */}
						</div>
					</div>
				))}
			</div>

			{/* 复制成功提示 */}
			{copySuccess && (
				<div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
					{copySuccess}
				</div>
			)}

			{/* 快捷操作 */}
			<div className="space-y-3">
				<div className="grid grid-cols-3 gap-2">
					<Button
						className="text-sm py-3"
						onClick={() => setShowSendETH(true)}
						disabled={
							!networkInfo?.isConnected ||
							parseFloat(balance) === 0
						}>
						💸 发送
					</Button>
					<Button
						variant="secondary"
						className="text-sm py-3"
						disabled>
						📥 接收
					</Button>
					<Button
						variant="secondary"
						className="text-sm py-3 relative"
						onClick={() => setShowTransactionHistory(true)}>
						📜 历史
						{pendingTransactionCount > 0 && (
							<span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
								{pendingTransactionCount}
							</span>
						)}
					</Button>
				</div>
				{parseFloat(balance) === 0 && (
					<div className="text-xs text-amber-600 text-center">
						⚠️ 余额不足，无法发送交易
					</div>
				)}
				{!networkInfo?.isConnected && (
					<div className="text-xs text-red-600 text-center">
						❌ 网络未连接，无法发送交易
					</div>
				)}
				{pendingTransactionCount > 0 && (
					<div className="text-xs text-yellow-600 text-center">
						⏳ 有 {pendingTransactionCount} 笔交易待确认
					</div>
				)}
			</div>

			{/* 最近交易 */}
			{lastTransactionHash && (
				<div className="bg-green-50 border border-green-200 rounded-lg p-4">
					<div className="text-sm font-medium text-green-800 mb-2">
						✅ 最近交易
					</div>
					<div className="space-y-2">
						<div className="text-xs text-green-700">
							交易哈希: {lastTransactionHash.slice(0, 10)}...
							{lastTransactionHash.slice(-8)}
						</div>
						<div className="flex space-x-2">
							<Button
								onClick={() => {
									const explorerLink = `${SEPOLIA_CONFIG.blockExplorerUrl}/tx/${lastTransactionHash}`
									window.open(explorerLink, '_blank')
								}}
								variant="secondary"
								className="text-xs py-1 px-2">
								🔍 查看详情
							</Button>
							<Button
								onClick={() => setLastTransactionHash('')}
								variant="secondary"
								className="text-xs py-1 px-2">
								✕ 关闭
							</Button>
						</div>
					</div>
				</div>
			)}

			{/* SendETH 组件 */}
			{showSendETH && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
						<div className="p-6">
							<SendETH
								currentAccount={currentAccount}
								onClose={() => setShowSendETH(false)}
								onTransactionSent={handleTransactionSent}
							/>
						</div>
					</div>
				</div>
			)}

			{/* TransactionHistory 组件 */}
			{showTransactionHistory && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
						<div className="p-6">
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-lg font-semibold">
									交易历史
								</h3>
								<Button
									onClick={() =>
										setShowTransactionHistory(false)
									}
									variant="secondary"
									className="text-sm px-3 py-1">
									✕ 关闭
								</Button>
							</div>
							<TransactionHistory
								currentAddress={currentAccount.address}
								onRefresh={handleRefreshTransactionHistory}
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
