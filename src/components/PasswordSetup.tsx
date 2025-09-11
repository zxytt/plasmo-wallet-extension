import React, { useEffect, useState } from 'react'

import { CryptoService } from '~services/CryptoService'
import { SecurityService } from '~services/SecurityService'

import { Button } from './Button'
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator'

interface PasswordSetupProps {
	onPasswordSet: (password: string) => void
	onBack?: () => void
}

export function PasswordSetup({ onPasswordSet, onBack }: PasswordSetupProps) {
	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [passwordStrength, setPasswordStrength] = useState<{
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
	} | null>(null)
	const [showPassword, setShowPassword] = useState(false)

	const handlePasswordChange = (value: string) => {
		setPassword(value)
		if (value) {
			const strength = CryptoService.validatePasswordStrength(value)
			setPasswordStrength(strength)
		} else {
			setPasswordStrength(null)
		}
	}

	const handleSubmit = () => {
		if (!password) {
			alert('请输入密码')
			return
		}

		if (!passwordStrength?.isValid) {
			alert(passwordStrength?.message || '密码不符合要求')
			return
		}

		if (password !== confirmPassword) {
			alert('两次输入的密码不一致')
			return
		}

		onPasswordSet(password)

		// 清理敏感数据
		clearSensitiveData()
	}

	// 清理敏感数据
	const clearSensitiveData = () => {
		// 安全清理密码
		SecurityService.clearPassword(password)
		SecurityService.clearPassword(confirmPassword)

		setPassword('')
		setConfirmPassword('')
		setPasswordStrength(null)

		console.log('PasswordSetup: 敏感数据已清理')
	}

	// 组件卸载时清理敏感数据
	useEffect(() => {
		return () => {
			clearSensitiveData()
		}
	}, [])

	return (
		<div className="space-y-6">
			<div className="text-center">
				<div className="text-4xl mb-3">🔐</div>
				<h2 className="text-2xl font-bold text-gray-800">
					设置钱包密码
				</h2>
				<p className="text-gray-600 mt-2">
					密码将用于保护您的助记词和私钥
				</p>
			</div>

			{/* 密码要求说明 */}
			<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
				<div className="flex items-start space-x-2">
					<span className="text-blue-600">ℹ️</span>
					<div className="text-blue-800 text-sm space-y-1">
						<div className="font-medium">密码要求:</div>
						<ul className="list-disc list-inside space-y-1 text-xs">
							<li>至少8个字符</li>
							<li>包含至少一个字母</li>
							<li>包含至少一个数字</li>
							<li>建议使用特殊字符增强安全性</li>
						</ul>
					</div>
				</div>
			</div>

			<div className="space-y-4">
				{/* 密码输入 */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						设置密码
					</label>
					<div className="relative">
						<input
							type={showPassword ? 'text' : 'password'}
							value={password}
							onChange={(e) =>
								handlePasswordChange(e.target.value)
							}
							placeholder="请输入密码"
							className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
						/>
						<button
							type="button"
							onClick={() => setShowPassword(!showPassword)}
							className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700">
							{showPassword ? '🙈' : '👁️'}
						</button>
					</div>
				</div>

				{/* 密码强度指示器 */}
				<PasswordStrengthIndicator
					strength={passwordStrength}
					password={password}
				/>

				{/* 确认密码 */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						确认密码
					</label>
					<input
						type={showPassword ? 'text' : 'password'}
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						placeholder="请再次输入密码"
						className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					/>
				</div>

				{/* 密码匹配提示 */}
				{confirmPassword && (
					<div
						className={`text-sm ${password === confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
						{password === confirmPassword
							? '✅ 密码匹配'
							: '❌ 密码不匹配'}
					</div>
				)}
			</div>

			{/* 操作按钮 */}
			<div className="space-y-3">
				<Button
					onClick={handleSubmit}
					disabled={
						!passwordStrength?.isValid ||
						password !== confirmPassword
					}
					className="w-full">
					设置密码并保存钱包
				</Button>
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
