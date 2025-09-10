import React, { useEffect, useState } from 'react'

import { NETWORKS } from '../config/blockchain'
import { blockchainService } from '../services/BlockchainService'
import { Card } from './Card'
import { ErrorAlert } from './ErrorAlert'

interface NetworkSwitcherProps {
	currentNetwork: string
	setCurrentNetwork?: (networkKey: string) => void
}

export const NetworkSwitcher: React.FC<NetworkSwitcherProps> = ({
	currentNetwork,
	setCurrentNetwork
}) => {
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		loadCurrentNetwork()
	}, [])

	const loadCurrentNetwork = async () => {
		try {
			setIsLoading(true)
			setError(null)

			await blockchainService.waitForInitialization()
			const network = blockchainService.getCurrentNetwork()
			const blockNumber = await blockchainService.getCurrentBlockNumber()
			setCurrentNetwork('sepolia')
		} catch (err: any) {
			setError(err.message)
		} finally {
			setIsLoading(false)
		}
	}

	const switchNetwork = async (networkKey: string) => {
		try {
			setIsLoading(true)
			setError(null)

			await blockchainService.switchNetwork(networkKey)
			const network = blockchainService.getCurrentNetwork()
			const blockNumber = await blockchainService.getCurrentBlockNumber()

			setCurrentNetwork(networkKey)
		} catch (err: any) {
			setError(err.message)
		} finally {
			setIsLoading(false)
		}
	}

	const getNetworkIcon = (chainId: number) => {
		switch (chainId) {
			case 1:
				return '🔷' // Ethereum Mainnet
			case 11155111:
				return '🧪' // Sepolia
			case 137:
				return '🟣' // Polygon
			case 56:
				return '🟡' // BSC
			case 42161:
				return '🔵' // Arbitrum
			case 10:
				return '🟠' // Optimism
			default:
				return '🔗'
		}
	}

	const getNetworkColor = (chainId: number) => {
		switch (chainId) {
			case 1:
				return 'border-blue-200 bg-blue-50'
			case 11155111:
				return 'border-purple-200 bg-purple-50'
			case 137:
				return 'border-purple-200 bg-purple-50'
			case 56:
				return 'border-yellow-200 bg-yellow-50'
			case 42161:
				return 'border-blue-200 bg-blue-50'
			case 10:
				return 'border-orange-200 bg-orange-50'
			default:
				return 'border-gray-200 bg-gray-50'
		}
	}

	return (
		<div className="space-y-4">
			{error && (
				<ErrorAlert
					error={error}
					onDismiss={() => setError(null)}
					showDismiss={true}
				/>
			)}

			{/* 网络列表 */}
			<Card>
				<h3 className="text-lg font-semibold mb-4">选择网络</h3>
				<div className="grid grid-cols-1 gap-2">
					{Object.entries(NETWORKS).map(([key, network]) => (
						<button
							key={key}
							onClick={() => switchNetwork(key)}
							disabled={isLoading || currentNetwork === key}
							className={`p-4 rounded-lg border-2 transition-all text-left ${
								currentNetwork === key
									? `${getNetworkColor(network.chainId)} border-current`
									: 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
							} ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
							<div className="flex items-center justify-between">
								<div className="flex items-center space-x-3">
									<span className="text-2xl">
										{getNetworkIcon(network.chainId)}
									</span>
									<div>
										<h4 className="font-medium text-gray-900">
											{network.name}
										</h4>
										<p className="text-sm text-gray-500">
											Chain ID: {network.chainId}
										</p>
									</div>
								</div>
								{currentNetwork === key && (
									<span className="text-green-600 font-medium">
										✓ 已连接
									</span>
								)}
							</div>
						</button>
					))}
				</div>
			</Card>
		</div>
	)
}
