import React, { useEffect, useState } from 'react'

import { gasEstimationService } from '../services/GasEstimationService'
import type { TransactionRequest } from '../types/blockchain'
import { Button } from './Button'
import { Card } from './Card'

export type GasSpeed = 'slow' | 'standard' | 'fast'

interface GasFeeOption {
	price: string
	time: number
	totalETH: string
}

interface GasFeeSelectorProps {
	transaction: TransactionRequest
	selectedSpeed: GasSpeed
	onSpeedChange: (speed: GasSpeed) => void
	onGasInfoUpdate?: (gasInfo: { gasLimit: string; gasPrice: string }) => void
	className?: string
}

export const GasFeeSelector: React.FC<GasFeeSelectorProps> = ({
	transaction,
	selectedSpeed,
	onSpeedChange,
	onGasInfoUpdate,
	className = ''
}) => {
	const [gasOptions, setGasOptions] = useState<{
		slow: GasFeeOption
		standard: GasFeeOption
		fast: GasFeeOption
	} | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		loadGasOptions()
	}, [transaction])

	const loadGasOptions = async () => {
		try {
			setLoading(true)
			setError(null)
			const options =
				await gasEstimationService.getGasOptions(transaction)
			setGasOptions(options)

			// 通知父组件Gas信息更新
			if (onGasInfoUpdate) {
				const gasInfo =
					await gasEstimationService.getTransactionGasInfo(
						transaction
					)
				onGasInfoUpdate({
					gasLimit: gasInfo.gasLimit,
					gasPrice: options[selectedSpeed].price
				})
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : '获取Gas费用失败')
		} finally {
			setLoading(false)
		}
	}

	const handleSpeedChange = (speed: GasSpeed) => {
		onSpeedChange(speed)

		// 通知父组件Gas信息更新
		if (onGasInfoUpdate && gasOptions) {
			gasEstimationService
				.getTransactionGasInfo(transaction)
				.then((gasInfo) => {
					onGasInfoUpdate({
						gasLimit: gasInfo.gasLimit,
						gasPrice: gasOptions[speed].price
					})
				})
		}
	}

	const formatTime = (seconds: number): string => {
		if (seconds < 60) {
			return `${seconds}秒`
		} else if (seconds < 3600) {
			return `${Math.round(seconds / 60)}分钟`
		} else {
			return `${Math.round(seconds / 3600)}小时`
		}
	}

	const getSpeedLabel = (speed: GasSpeed): string => {
		switch (speed) {
			case 'slow':
				return '慢速'
			case 'standard':
				return '标准'
			case 'fast':
				return '快速'
		}
	}

	const getSpeedDescription = (speed: GasSpeed): string => {
		switch (speed) {
			case 'slow':
				return '节省费用，确认时间较长'
			case 'standard':
				return '平衡费用和速度'
			case 'fast':
				return '快速确认，费用较高'
		}
	}

	if (loading) {
		return (
			<Card className={`p-4 ${className}`}>
				<div className="text-center">
					<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
					<p className="text-sm text-gray-600">正在获取Gas费用...</p>
				</div>
			</Card>
		)
	}

	if (error) {
		return (
			<Card className={`p-4 border-red-200 ${className}`}>
				<div className="text-center">
					<p className="text-red-600 text-sm mb-2">{error}</p>
					<Button
						variant="secondary"
						size="sm"
						onClick={loadGasOptions}>
						重试
					</Button>
				</div>
			</Card>
		)
	}

	if (!gasOptions) {
		return null
	}

	return (
		<Card className={`p-4 ${className}`}>
			<h3 className="text-sm font-medium text-gray-900 mb-3">
				选择Gas费用
			</h3>

			<div className="space-y-2">
				{(['slow', 'standard', 'fast'] as const).map((speed) => {
					const option = gasOptions[speed]
					const isSelected = selectedSpeed === speed

					return (
						<div
							key={speed}
							className={`
                p-3 rounded-lg border cursor-pointer transition-all
                ${
					isSelected
						? 'border-blue-500 bg-blue-50'
						: 'border-gray-200 hover:border-gray-300'
				}
              `}
							onClick={() => handleSpeedChange(speed)}>
							<div className="flex items-center justify-between">
								<div className="flex items-center space-x-3">
									<div
										className={`
                    w-4 h-4 rounded-full border-2 flex items-center justify-center
                    ${isSelected ? 'border-blue-500' : 'border-gray-300'}
                  `}>
										{isSelected && (
											<div className="w-2 h-2 rounded-full bg-blue-500"></div>
										)}
									</div>

									<div>
										<div className="flex items-center space-x-2">
											<span className="font-medium text-sm">
												{getSpeedLabel(speed)}
											</span>
											<span className="text-xs text-gray-500">
												~{formatTime(option.time)}
											</span>
										</div>
										<p className="text-xs text-gray-600 mt-1">
											{getSpeedDescription(speed)}
										</p>
									</div>
								</div>

								<div className="text-right">
									<div className="text-sm font-medium">
										{parseFloat(option.totalETH).toFixed(6)}{' '}
										ETH
									</div>
									<div className="text-xs text-gray-500">
										{parseFloat(option.price).toFixed(1)}{' '}
										Gwei
									</div>
								</div>
							</div>
						</div>
					)
				})}
			</div>

			<div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
				<p>💡 Gas费用会根据网络拥堵情况实时变化</p>
			</div>
		</Card>
	)
}
