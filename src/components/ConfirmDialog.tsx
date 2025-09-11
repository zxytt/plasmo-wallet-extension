import React from 'react'

import { Button } from './Button'

interface ConfirmDialogProps {
	isOpen: boolean
	title: string
	message: string | React.ReactNode
	confirmText?: string
	cancelText?: string
	onConfirm: () => void
	onCancel: () => void
	onClose?: () => void
	type?: 'info' | 'warning' | 'danger'
	confirmButtonVariant?: 'primary' | 'secondary' | 'danger'
	isLoading?: boolean
}

export function ConfirmDialog({
	isOpen,
	title,
	message,
	confirmText = '确认',
	cancelText = '取消',
	onConfirm,
	onCancel,
	onClose,
	type = 'info',
	confirmButtonVariant,
	isLoading = false
}: ConfirmDialogProps) {
	if (!isOpen) return null

	const getTypeStyles = () => {
		switch (type) {
			case 'warning':
				return {
					icon: '⚠️',
					bgColor: 'bg-yellow-50',
					borderColor: 'border-yellow-200',
					titleColor: 'text-yellow-800',
					messageColor: 'text-yellow-700'
				}
			case 'danger':
				return {
					icon: '🚨',
					bgColor: 'bg-red-50',
					borderColor: 'border-red-200',
					titleColor: 'text-red-800',
					messageColor: 'text-red-700'
				}
			default:
				return {
					icon: 'ℹ️',
					bgColor: 'bg-blue-50',
					borderColor: 'border-blue-200',
					titleColor: 'text-blue-800',
					messageColor: 'text-blue-700'
				}
		}
	}

	const styles = getTypeStyles()

	return (
		<div className="modal-overlay">
			<div className="modal-content">
				<div
					className={`p-6 ${styles.bgColor} border ${styles.borderColor} rounded-t-lg`}>
					<div className="flex items-start space-x-3">
						<span className="text-2xl flex-shrink-0">
							{styles.icon}
						</span>
						<div className="flex-1">
							<h3
								className={`text-lg font-semibold ${styles.titleColor} mb-2`}>
								{title}
							</h3>
							<div className={`text-sm ${styles.messageColor}`}>
								{message}
							</div>
						</div>
					</div>
				</div>

				<div className="p-6 theme-surface rounded-b-lg">
					<div className="flex space-x-3 justify-end">
						<Button
							onClick={onClose || onCancel}
							variant="secondary"
							disabled={isLoading}>
							{cancelText}
						</Button>
						<Button
							onClick={onConfirm}
							variant={
								confirmButtonVariant ||
								(type === 'danger' ? 'danger' : 'primary')
							}
							disabled={isLoading}>
							{confirmText}
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}
