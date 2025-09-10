import React from 'react'

interface PasswordStrengthResult {
	isValid: boolean
	message: string
	score?: number
	requirements?: {
		length: boolean
		hasLower: boolean
		hasUpper: boolean
		hasNumber: boolean
		hasSpecial: boolean
	}
}

interface PasswordStrengthIndicatorProps {
	strength: PasswordStrengthResult | null
	password: string
}

export function PasswordStrengthIndicator({
	strength,
	password
}: PasswordStrengthIndicatorProps) {
	if (!password || !strength) return null

	const getStrengthColor = (score: number) => {
		switch (score) {
			case 0:
			case 1:
				return 'text-red-600'
			case 2:
				return 'text-yellow-600'
			case 3:
				return 'text-blue-600'
			case 4:
				return 'text-green-600'
			default:
				return 'text-gray-600'
		}
	}

	const getStrengthBg = (score: number) => {
		switch (score) {
			case 0:
			case 1:
				return 'bg-red-50 border-red-200'
			case 2:
				return 'bg-yellow-50 border-yellow-200'
			case 3:
				return 'bg-blue-50 border-blue-200'
			case 4:
				return 'bg-green-50 border-green-200'
			default:
				return 'bg-gray-50 border-gray-200'
		}
	}

	const getStrengthBarColor = (score: number) => {
		switch (score) {
			case 0:
			case 1:
				return 'bg-red-500'
			case 2:
				return 'bg-yellow-500'
			case 3:
				return 'bg-blue-500'
			case 4:
				return 'bg-green-500'
			default:
				return 'bg-gray-300'
		}
	}

	const strengthLabels = ['很弱', '较弱', '一般', '良好', '很强']
	const strengthWidth = Math.max((strength.score + 1) * 20, 20) // 最少20%

	return (
		<div
			className={`p-4 rounded-lg border ${getStrengthBg(strength.score)}`}>
			{/* 强度条和标签 */}
			<div className="flex items-center justify-between mb-3">
				<span className="text-sm font-medium text-gray-700">
					密码强度
				</span>
				<span
					className={`text-sm font-medium ${getStrengthColor(strength.score)}`}>
					{strengthLabels[strength.score] || '未知'}
				</span>
			</div>

			{/* 强度进度条 */}
			<div className="w-full bg-gray-200 rounded-full h-2 mb-3">
				<div
					className={`h-2 rounded-full transition-all duration-300 ${getStrengthBarColor(strength.score)}`}
					style={{ width: `${strengthWidth}%` }}></div>
			</div>

			{/* 主要消息 */}
			<div className={`text-sm mb-3 ${getStrengthColor(strength.score)}`}>
				{strength.isValid ? '✅' : '❌'} {strength.message}
			</div>

			{/* 详细要求检查 */}
			<div className="space-y-1">
				<div className="text-xs font-medium text-gray-600 mb-2">
					密码要求:
				</div>
				<div className="grid grid-cols-1 gap-1 text-xs">
					<div
						className={`flex items-center space-x-2 ${strength.requirements?.length ? 'text-green-600' : 'text-gray-500'}`}>
						<span>
							{strength.requirements?.length ? '✅' : '⭕'}
						</span>
						<span>至少8个字符</span>
					</div>
					<div
						className={`flex items-center space-x-2 ${strength.requirements?.hasLower ? 'text-green-600' : 'text-gray-500'}`}>
						<span>
							{strength.requirements?.hasLower ? '✅' : '⭕'}
						</span>
						<span>包含小写字母</span>
					</div>
					<div
						className={`flex items-center space-x-2 ${strength.requirements?.hasUpper ? 'text-green-600' : 'text-gray-500'}`}>
						<span>
							{strength.requirements?.hasUpper ? '✅' : '⭕'}
						</span>
						<span>包含大写字母</span>
					</div>
					<div
						className={`flex items-center space-x-2 ${strength.requirements?.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
						<span>
							{strength.requirements?.hasNumber ? '✅' : '⭕'}
						</span>
						<span>包含数字</span>
					</div>
					<div
						className={`flex items-center space-x-2 ${strength.requirements?.hasSpecial ? 'text-green-600' : 'text-gray-500'}`}>
						<span>
							{strength.requirements?.hasSpecial ? '✅' : '⭕'}
						</span>
						<span>包含特殊字符 (推荐)</span>
					</div>
				</div>
			</div>

			{/* 安全提示 */}
			{strength.score < 3 && (
				<div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs text-yellow-800">
					💡 建议使用更强的密码来保护您的钱包安全
				</div>
			)}
		</div>
	)
}
