import { ethers } from 'ethers'
import React, { useEffect, useState } from 'react'

import { blockchainService } from '~services/BlockchainService'
import { transactionService } from '~services/TransactionService'
import type { TransactionRecord } from '~types/blockchain'

import { Button } from './Button'

interface TransactionHistoryProps {
	currentAddress: string
	onRefresh?: () => void
}

interface TransactionItemProps {
	transaction: TransactionRecord
	currentAddress: string
	onViewDetails: (tx: TransactionRecord) => void
}

function TransactionItem({
	transaction,
	currentAddress,
	onViewDetails
}: TransactionItemProps) {
	const isOutgoing =
		transaction.from.toLowerCase() === currentAddress.toLowerCase()
	const otherAddress = isOutgoing ? transaction.to : transaction.from

	const getStatusDisplay = () => {
		switch (transaction.status) {
			case 'pending':
				return {
					icon: '⏳',
					text: '待确认',
					color: 'text-yellow-600',
					bgColor: 'bg-yellow-50'
				}
			case 'success':
				return {
					icon: '✅',
					text: '成功',
					color: 'text-green-600',
					bgColor: 'bg-green-50'
				}
			case 'failed':
				return {
					icon: '❌',
					text: '失败',
					color: 'text-red-600',
					bgColor: 'bg-red-50'
				}
			default:
				return {
					icon: '❓',
					text: '未知',
					color: 'text-gray-600',
					bgColor: 'bg-gray-50'
				}
		}
	}

	const statusDisplay = getStatusDisplay()
	const formattedAmount = formatAmount(transaction.value)

	return (
		<div
			className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
			onClick={() => onViewDetails(transaction)}>
			<div className="flex items-start justify-between">
				{/* 左侧：交易类型和地址 */}
				<div className="flex items-start space-x-3 flex-1">
					<div
						className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
							isOutgoing ? 'bg-red-100' : 'bg-green-100'
						}`}>
						{isOutgoing ? '📤' : '📥'}
					</div>
					<div className="flex-1 min-w-0">
						<div className="font-medium text-gray-900 mb-1">
							{isOutgoing ? '发送' : '接收'} ETH
						</div>
						<div className="text-sm text-gray-500 mb-2">
							{isOutgoing ? '至' : '来自'}
						</div>
						<div className="text-xs font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded">
							{otherAddress.slice(0, 8)}...
							{otherAddress.slice(-6)}
						</div>
					</div>
				</div>

				{/* 右侧：金额和状态 */}
				<div className="text-right ml-4">
					<div
						className={`font-bold text-lg mb-1 ${isOutgoing ? 'text-red-600' : 'text-green-600'}`}>
						{isOutgoing ? '-' : '+'}
						{formattedAmount}
					</div>
					<div className="text-xs text-gray-500 mb-2">ETH</div>
					<div
						className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${statusDisplay.bgColor} ${statusDisplay.color} border`}>
						<span>{statusDisplay.icon}</span>
						<span>{statusDisplay.text}</span>
					</div>
				</div>
			</div>

			{/* 底部：时间和Gas费用 */}
			<div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
				<span>
					{new Date(transaction.timestamp).toLocaleString('zh-CN', {
						year: 'numeric',
						month: '2-digit',
						day: '2-digit',
						hour: '2-digit',
						minute: '2-digit'
					})}
				</span>
				{transaction.gasUsed !== '0' && (
					<span className="bg-gray-100 px-2 py-1 rounded">
						Gas: {parseInt(transaction.gasUsed).toLocaleString()}
					</span>
				)}
			</div>
		</div>
	)
}

// 工具函数：格式化金额
const formatAmount = (weiValue: string): string => {
	try {
		if (!weiValue || weiValue === '0') return '0.000000'
		const ethAmount = ethers.formatEther(weiValue)
		const numAmount = parseFloat(ethAmount)
		return numAmount.toFixed(6)
	} catch (error) {
		console.error('金额格式化失败:', error, 'value:', weiValue)
		return '0.000000'
	}
}

export function TransactionHistory({
	currentAddress,
	onRefresh
}: TransactionHistoryProps) {
	const [transactions, setTransactions] = useState<TransactionRecord[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [selectedTransaction, setSelectedTransaction] =
		useState<TransactionRecord | null>(null)
	const [isRefreshing, setIsRefreshing] = useState(false)

	useEffect(() => {
		loadTransactionHistory()

		// 定期检查待确认交易的状态
		const interval = setInterval(() => {
			checkPendingTransactions()
		}, 10000) // 每10秒检查一次

		return () => clearInterval(interval)
	}, [currentAddress])

	const loadTransactionHistory = async () => {
		try {
			setIsLoading(true)
			setError(null)

			const history =
				await transactionService.getTransactionHistory(currentAddress)
			setTransactions(history)
		} catch (error) {
			console.error('加载交易历史失败:', error)
			setError('加载交易历史失败')
		} finally {
			setIsLoading(false)
		}
	}

	const checkPendingTransactions = async () => {
		try {
			const pendingTxs = transactions.filter(
				(tx) => tx.status === 'pending'
			)

			for (const tx of pendingTxs) {
				const updatedRecord = await transactionService.trackTransaction(
					tx.hash
				)
				if (updatedRecord && updatedRecord.status !== 'pending') {
					// 更新本地状态
					setTransactions((prev) =>
						prev.map((t) =>
							t.hash === tx.hash ? updatedRecord : t
						)
					)

					// 如果交易确认成功，触发余额刷新
					if (updatedRecord.status === 'success' && onRefresh) {
						onRefresh()
					}
				}
			}
		} catch (error) {
			console.error('检查待确认交易失败:', error)
		}
	}

	const handleRefresh = async () => {
		setIsRefreshing(true)
		await loadTransactionHistory()
		await checkPendingTransactions()
		if (onRefresh) {
			onRefresh()
		}
		setIsRefreshing(false)
	}

	const handleViewDetails = (transaction: TransactionRecord) => {
		setSelectedTransaction(transaction)
	}

	const handleViewInExplorer = (txHash: string) => {
		const explorerUrl = `https://sepolia.etherscan.io/tx/${txHash}`
		window.open(explorerUrl, '_blank')
	}

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="text-center">
					<div className="text-4xl mb-3">📜</div>
					<h2 className="text-2xl font-bold text-gray-800">
						交易历史
					</h2>
					<p className="text-gray-600 mt-1">正在加载交易记录...</p>
				</div>

				<div className="flex justify-center">
					<div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="space-y-6">
				<div className="text-center">
					<div className="text-4xl mb-3">❌</div>
					<h2 className="text-2xl font-bold text-gray-800">
						加载失败
					</h2>
					<p className="text-gray-600 mt-1">{error}</p>
				</div>

				<div className="flex space-x-3">
					<Button
						onClick={loadTransactionHistory}
						variant="secondary"
						className="flex-1">
						重试
					</Button>
				</div>
			</div>
		)
	}

	// 交易详情模态框
	if (selectedTransaction) {
		const isOutgoing =
			selectedTransaction.from.toLowerCase() ===
			currentAddress.toLowerCase()
		const statusDisplay = (() => {
			switch (selectedTransaction.status) {
				case 'pending':
					return {
						icon: '⏳',
						text: '待确认',
						color: 'text-yellow-600',
						bgColor: 'bg-yellow-50',
						borderColor: 'border-yellow-200'
					}
				case 'success':
					return {
						icon: '✅',
						text: '交易成功',
						color: 'text-green-600',
						bgColor: 'bg-green-50',
						borderColor: 'border-green-200'
					}
				case 'failed':
					return {
						icon: '❌',
						text: '交易失败',
						color: 'text-red-600',
						bgColor: 'bg-red-50',
						borderColor: 'border-red-200'
					}
				default:
					return {
						icon: '❓',
						text: '未知状态',
						color: 'text-gray-600',
						bgColor: 'bg-gray-50',
						borderColor: 'border-gray-200'
					}
			}
		})()

		return (
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<h2 className="text-xl font-bold text-gray-800">
						交易详情
					</h2>
					<Button
						onClick={() => setSelectedTransaction(null)}
						variant="secondary"
						className="text-sm px-3 py-1">
						← 返回
					</Button>
				</div>

				<div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
					{/* 状态头部 */}
					<div
						className={`${statusDisplay.bgColor} ${statusDisplay.borderColor} border-b px-6 py-4`}>
						<div className="flex items-center justify-center space-x-3">
							<div className="text-3xl">{statusDisplay.icon}</div>
							<div>
								<div
									className={`text-lg font-semibold ${statusDisplay.color}`}>
									{statusDisplay.text}
								</div>
								<div className="text-sm text-gray-600">
									{isOutgoing ? '发送' : '接收'} ETH 交易
								</div>
							</div>
						</div>
					</div>

					{/* 金额显示 */}
					<div className="px-6 py-4 bg-gray-50 border-b">
						<div className="text-center">
							<div className="text-sm text-gray-600 mb-1">
								交易金额
							</div>
							<div
								className={`text-2xl font-bold ${isOutgoing ? 'text-red-600' : 'text-green-600'}`}>
								{isOutgoing ? '-' : '+'}
								{formatAmount(selectedTransaction.value)} ETH
							</div>
						</div>
					</div>

					{/* 交易信息 */}
					<div className="px-6 py-4 space-y-4">
						<div className="space-y-3">
							<div>
								<div className="text-sm text-gray-600 mb-1">
									交易哈希
								</div>
								<div className="text-gray-800 font-mono text-sm bg-gray-50 p-2 rounded break-all">
									{selectedTransaction.hash}
								</div>
							</div>

							<div className="grid grid-cols-1 gap-3">
								<div>
									<div className="text-sm text-gray-600 mb-1">
										发送方
									</div>
									<div className="text-gray-800 font-mono text-sm bg-gray-50 p-2 rounded">
										{selectedTransaction.from}
									</div>
								</div>

								<div>
									<div className="text-sm text-gray-600 mb-1">
										接收方
									</div>
									<div className="text-gray-800 font-mono text-sm bg-gray-50 p-2 rounded">
										{selectedTransaction.to}
									</div>
								</div>
							</div>

							{selectedTransaction.gasUsed !== '0' && (
								<div className="grid grid-cols-2 gap-3">
									<div>
										<div className="text-sm text-gray-600 mb-1">
											Gas 使用
										</div>
										<div className="text-gray-800 font-mono text-sm bg-gray-50 p-2 rounded">
											{parseInt(
												selectedTransaction.gasUsed
											).toLocaleString()}
										</div>
									</div>
									<div>
										<div className="text-sm text-gray-600 mb-1">
											Gas 价格
										</div>
										<div className="text-gray-800 font-mono text-sm bg-gray-50 p-2 rounded">
											{selectedTransaction.gasPrice
												? `${ethers.formatUnits(selectedTransaction.gasPrice, 'gwei')} Gwei`
												: 'N/A'}
										</div>
									</div>
								</div>
							)}

							{selectedTransaction.blockNumber && (
								<div>
									<div className="text-sm text-gray-600 mb-1">
										区块号
									</div>
									<div className="text-gray-800 font-mono text-sm bg-gray-50 p-2 rounded">
										#
										{selectedTransaction.blockNumber.toLocaleString()}
									</div>
								</div>
							)}

							<div>
								<div className="text-sm text-gray-600 mb-1">
									交易时间
								</div>
								<div className="text-gray-800 text-sm bg-gray-50 p-2 rounded">
									{new Date(
										selectedTransaction.timestamp
									).toLocaleString('zh-CN', {
										year: 'numeric',
										month: '2-digit',
										day: '2-digit',
										hour: '2-digit',
										minute: '2-digit',
										second: '2-digit'
									})}
								</div>
							</div>
						</div>
					</div>

					{/* 操作按钮 */}
					<div className="px-6 py-4 bg-gray-50 border-t">
						<Button
							onClick={() =>
								handleViewInExplorer(selectedTransaction.hash)
							}
							variant="primary"
							className="w-full">
							🔍 在 Etherscan 中查看
						</Button>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			{/* 头部 */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold text-gray-800">
						交易历史
					</h2>
					<p className="text-gray-600 mt-1">
						{transactions.length > 0
							? `共 ${transactions.length} 笔交易`
							: '暂无交易记录'}
					</p>
				</div>

				<Button
					onClick={handleRefresh}
					variant="secondary"
					disabled={isRefreshing}
					className="text-sm">
					{isRefreshing ? (
						<div className="flex items-center space-x-2">
							<div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
							<span>刷新中</span>
						</div>
					) : (
						'刷新'
					)}
				</Button>
			</div>

			{/* 交易列表 */}
			{transactions.length === 0 ? (
				<div className="text-center py-12">
					<div className="text-6xl mb-4">📭</div>
					<h3 className="text-lg font-medium text-gray-900 mb-2">
						暂无交易记录
					</h3>
					<p className="text-gray-500">
						您还没有进行过任何交易。发送或接收 ETH
						后，交易记录将显示在这里。
					</p>
				</div>
			) : (
				<div className="space-y-3">
					{transactions.map((transaction) => (
						<TransactionItem
							key={transaction.hash}
							transaction={transaction}
							currentAddress={currentAddress}
							onViewDetails={handleViewDetails}
						/>
					))}
				</div>
			)}

			{/* 底部提示 */}
			{transactions.length > 0 && (
				<div className="text-center text-sm text-gray-500">
					点击任意交易查看详细信息
				</div>
			)}
		</div>
	)
}
