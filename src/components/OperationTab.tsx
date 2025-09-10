import React from 'react'

import { Button } from './Button'

interface OperationTabProps {
	onLockWallet: () => void
}

export const OperationTab: React.FC<OperationTabProps> = ({ onLockWallet }) => {
	return (
		<div className="border-t border-gray-200 pt-4 space-y-3">
			<div className="flex space-x-2">
				<Button
					onClick={onLockWallet}
					variant="secondary"
					className="flex-1 text-sm py-2">
					🔒 锁定钱包
				</Button>
			</div>
		</div>
	)
}
