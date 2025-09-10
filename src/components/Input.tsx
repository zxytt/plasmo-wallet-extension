/**
 * Input 组件 - MetaMask 风格的输入框组件
 * 支持密码显示/隐藏切换、错误状态和验证提示
 */
import React, { forwardRef, useState } from 'react'

interface InputProps {
	type?: 'text' | 'password' | 'email' | 'number' | 'tel'
	placeholder?: string
	value?: string
	defaultValue?: string
	onChange?: (value: string) => void
	onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
	onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void
	disabled?: boolean
	error?: string | boolean
	label?: string
	required?: boolean
	className?: string
	fullWidth?: boolean
	size?: 'sm' | 'md' | 'lg'
	showPasswordToggle?: boolean
	autoComplete?: string
	name?: string
	id?: string
	step?: string
	min?: string
	max?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
	(
		{
			type = 'text',
			placeholder,
			value,
			defaultValue,
			onChange,
			onBlur,
			onFocus,
			disabled = false,
			error,
			label,
			required = false,
			className = '',
			fullWidth = true,
			size = 'md',
			showPasswordToggle = false,
			autoComplete,
			name,
			id
		},
		ref
	) => {
		const [showPassword, setShowPassword] = useState(false)
		const [isFocused, setIsFocused] = useState(false)

		// 确定实际的输入类型
		const actualType = type === 'password' && showPassword ? 'text' : type

		// 是否显示密码切换按钮
		const shouldShowToggle =
			(type === 'password' || showPasswordToggle) && !disabled

		// 基础样式类
		const baseClasses = [
			'input',
			'relative',
			'block',
			'border',
			'rounded-lg',
			'transition-all',
			'duration-150',
			'ease-in-out',
			'focus:outline-none',
			'focus:ring-2',
			'focus:ring-offset-0',
			'disabled:opacity-50',
			'disabled:cursor-not-allowed',
			'disabled:bg-gray-50'
		].join(' ')

		// 尺寸样式
		const sizeClasses = {
			sm: 'h-8 px-3 text-sm',
			md: 'h-12 px-4 text-base',
			lg: 'h-14 px-5 text-lg'
		}

		// 状态样式
		const stateClasses = error
			? [
					'border-red-300',
					'text-red-900',
					'placeholder-red-300',
					'focus:border-red-500',
					'focus:ring-red-500'
				].join(' ')
			: isFocused
				? [
						'border-blue-500',
						'ring-2',
						'ring-blue-500',
						'ring-opacity-20'
					].join(' ')
				: [
						'border-gray-300',
						'text-gray-900',
						'placeholder-gray-400',
						'hover:border-gray-400',
						'focus:border-blue-500',
						'focus:ring-blue-500'
					].join(' ')

		// 宽度样式
		const widthClass = fullWidth ? 'w-full' : ''

		// 处理输入变化
		const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			onChange?.(e.target.value)
		}

		// 处理焦点事件
		const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
			setIsFocused(true)
			onFocus?.(e)
		}

		const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
			setIsFocused(false)
			onBlur?.(e)
		}

		// 切换密码显示
		const togglePasswordVisibility = () => {
			setShowPassword(!showPassword)
		}

		// 眼睛图标
		const EyeIcon = ({ visible }: { visible: boolean }) => (
			<svg
				className="h-5 w-5 text-gray-400 hover:text-gray-600"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor">
				{visible ? (
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
					/>
				) : (
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
					/>
				)}
			</svg>
		)

		return (
			<div className={`${widthClass} ${className}`}>
				{/* 标签 */}
				{label && (
					<label
						htmlFor={id}
						className="block text-sm font-medium text-gray-700 mb-2">
						{label}
						{required && (
							<span className="text-red-500 ml-1">*</span>
						)}
					</label>
				)}

				{/* 输入框容器 */}
				<div className="relative">
					<input
						ref={ref}
						type={actualType}
						id={id}
						name={name}
						value={value}
						defaultValue={defaultValue}
						placeholder={placeholder}
						onChange={handleChange}
						onFocus={handleFocus}
						onBlur={handleBlur}
						disabled={disabled}
						required={required}
						autoComplete={autoComplete}
						className={`${baseClasses} ${sizeClasses[size]} ${stateClasses} ${widthClass} ${
							shouldShowToggle ? 'pr-12' : ''
						}`}
						aria-invalid={error ? 'true' : 'false'}
						aria-describedby={error ? `${id}-error` : undefined}
					/>

					{/* 密码显示/隐藏切换按钮 */}
					{shouldShowToggle && (
						<button
							type="button"
							className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
							onClick={togglePasswordVisibility}
							tabIndex={-1}
							aria-label={showPassword ? '隐藏密码' : '显示密码'}>
							<EyeIcon visible={showPassword} />
						</button>
					)}
				</div>

				{/* 错误信息 */}
				{error && typeof error === 'string' && (
					<p
						id={`${id}-error`}
						className="mt-2 text-sm text-red-600"
						role="alert">
						{error}
					</p>
				)}
			</div>
		)
	}
)

Input.displayName = 'Input'
