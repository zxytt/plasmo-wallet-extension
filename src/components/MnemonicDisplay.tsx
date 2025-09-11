import React, { useState } from 'react'

import { Button } from './Button'

interface MnemonicDisplayProps {
	mnemonic: string
	onContinue?: () => void
	onBack?: () => void
}

export function MnemonicDisplay({
	mnemonic,
	onContinue,
	onBack
}: MnemonicDisplayProps) {
	const [isRevealed, setIsRevealed] = useState(false)
	const [isCopied, setIsCopied] = useState(false)

	const words = mnemonic.split(' ')

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(mnemonic)
			setIsCopied(true)
			setTimeout(() => setIsCopied(false), 2000)
		} catch (error) {
			console.error('复制失败:', error)
		}
	}

	const handleReveal = () => {
		setIsRevealed(true)
	}

	return (
		<div className="space-y-6">
			<div className="text-center">
				<div className="text-4xl mb-3">🔐</div>
				<h2 className="text-2xl font-bold text-gray-800">您的助记词</h2>
				<p className="text-gray-600 mt-2">
					请安全保存这12个单词，它们是恢复钱包的唯一方式
				</p>
			</div>

			{/* 安全警告 */}
			<div className="bg-red-50 border border-red-200 rounded-lg p-4">
				<div className="flex items-start space-x-2">
					<span className="text-red-600 text-lg">⚠️</span>
					<div className="text-red-800 text-sm space-y-1">
						<div className="font-medium">重要安全提示:</div>
						<ul className="list-disc list-inside space-y-1 text-xs">
							<li>请将助记词写在纸上并安全保存</li>
							<li>不要截图或保存在电脑上</li>
							<li>不要与任何人分享</li>
							<li>丢失助记词将无法恢复钱包</li>
						</ul>
					</div>
				</div>
			</div>

			{/* 助记词显示区域 */}
			<div className="bg-gray-50 rounded-lg p-4">
				{!isRevealed ? (
					<div className="text-center space-y-4">
						<div className="text-gray-500">
							<div className="text-4xl mb-2">👁️</div>
							<p>点击下方按钮显示助记词</p>
						</div>
						<Button onClick={handleReveal} className="w-full">
							显示助记词
						</Button>
					</div>
				) : (
					<div className="space-y-4">
						{/* 助记词网格 */}
						<div className="grid grid-cols-3 gap-3">
							{words.map((word, index) => (
								<div
									key={index}
									className="bg-white border border-gray-200 rounded-lg p-3 text-center">
									<div className="text-xs text-gray-500 mb-1">
										{index + 1}
									</div>
									<div className="font-medium text-gray-800">
										{word}
									</div>
								</div>
							))}
						</div>

						{/* 复制按钮 */}
						<Button
							onClick={handleCopy}
							variant="secondary"
							className="w-full">
							{isCopied ? '✅ 已复制' : '📋 复制助记词'}
						</Button>
					</div>
				)}
			</div>

			{/* 确认提示 */}
			{isRevealed && (
				<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
					<div className="flex items-center space-x-2">
						<span className="text-blue-600">ℹ️</span>
						<span className="text-blue-800 text-sm">
							请确认您已安全保存助记词后继续
						</span>
					</div>
				</div>
			)}

			{/* 操作按钮 */}
			<div className="space-y-3">
				{isRevealed && onContinue && (
					<Button onClick={onContinue} className="w-full">
						我已安全保存 →
					</Button>
				)}
				{onBack && (
					<Button
						onClick={onBack}
						variant="secondary"
						className="w-full">
						← 返回
					</Button>
				)}
			</div>
		</div>
	)
}
