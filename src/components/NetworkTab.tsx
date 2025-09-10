import React, { useEffect, useState } from 'react'

import { SEPOLIA_CONFIG } from '~config/networks'
import { NetworkService } from '~services/NetworkService'

import { Button } from './Button'

interface NetworkTabProps {
	// onLockWallet: () => void
}

export const NetworkTab: React.FC<NetworkTabProps> = () => {
	const [networkInfo, setNetworkInfo] = useState<{
		chainId: number
		blockNumber: number
		gasPrice: string
		isConnected: boolean
	} | null>(null)

	useEffect(() => {
		init()
		return () => {
			setNetworkInfo(null)
		}
	}, [])

	const init = async () => {
		const [networkData] = await Promise.all([
			NetworkService.getNetworkInfo().catch((error) => {
				console.error('网络信息获取失败:', error)
				return {
					chainId: 0,
					blockNumber: 0,
					gasPrice: '0',
					isConnected: false
				}
			})
		])
		setNetworkInfo(networkData)
	}

	return (
		<div className="border-t border-gray-200 pt-4 space-y-3">
			{/* 网络状态 */}
			<div
				className={`border rounded-lg p-4 ${
					networkInfo?.isConnected
						? 'bg-green-50 border-green-200'
						: 'bg-red-50 border-red-200'
				}`}>
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-2">
						<div
							className={`w-3 h-3 rounded-full ${
								networkInfo?.isConnected
									? 'bg-green-500 animate-pulse'
									: 'bg-red-500'
							}`}></div>
						<span
							className={`font-medium ${
								networkInfo?.isConnected
									? 'text-green-800'
									: 'text-red-800'
							}`}>
							{SEPOLIA_CONFIG.name}
						</span>
					</div>
					<div
						className={`text-sm ${
							networkInfo?.isConnected
								? 'text-green-700'
								: 'text-red-700'
						}`}>
						链 ID: {networkInfo?.chainId || SEPOLIA_CONFIG.chainId}
					</div>
				</div>
				<div
					className={`text-xs mt-2 ${
						networkInfo?.isConnected
							? 'text-green-600'
							: 'text-red-600'
					}`}>
					{networkInfo?.isConnected ? (
						<div className="flex items-center justify-between">
							<span>🌐 已连接到测试网络</span>
							{networkInfo.blockNumber > 0 && (
								<span>区块: #{networkInfo.blockNumber}</span>
							)}
						</div>
					) : (
						<span>❌ 网络连接失败</span>
					)}
				</div>
			</div>
		</div>
	)
}
