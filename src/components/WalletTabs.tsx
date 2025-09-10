import React, { useState, useEffect } from 'react'

import { MainWallet } from './MainWallet'
import { NetworkSwitcher } from './NetworkSwitcher'
import { NetworkTab } from './NetworkTab'
import { NftTab } from './NftTab'
import { OperationTab } from './OperationTab'
import { AccountService } from '~services/AccountService'

interface WalletTabsProps {
	currentAccount: {
		address: string
		privateKey: string
		mnemonic?: string
	}
	onLockWallet: () => void
}

type TabType = 'network' | 'nft' | 'settings'

export const WalletTabs: React.FC<WalletTabsProps> = ({
	currentAccount,
	onLockWallet
}) => {
	const [activeTab, setActiveTab] = useState<TabType>('network')
	const tabs = [
		{ id: 'network' as TabType, label: 'Network', icon: '🌐' },
		{ id: 'nft' as TabType, label: 'NFT', icon: '🖼️' },
		{ id: 'settings' as TabType, label: 'Operation', icon: '⚙️' }
	]
	const [currentNetwork, setCurrentNetwork] = useState<string>('sepolia')

  useEffect(() => {
    AccountService.initialize()
  })

	return (
		<div className="h-full flex flex-col">
			{/* 用户详情 */}
			<div className="flex-1 overflow-auto">
				<MainWallet
					currentNetwork={currentNetwork}
					currentAccount={currentAccount}
				/>
			</div>
			{/* 标签页导航 */}
			<div className="flex border-b border-gray-200 bg-white mt-2">
				{tabs.map((tab) => (
					<button
						key={tab.id}
						onClick={() => setActiveTab(tab.id)}
						className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
							activeTab === tab.id
								? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
								: 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
						}`}>
						<span className="mr-2">{tab.icon}</span>
						{tab.label}
					</button>
				))}
			</div>

			{/* 标签页内容 */}
			<div className="flex-1 overflow-auto">
				{activeTab === 'network' && (
					<NetworkSwitcher
						currentNetwork={currentNetwork}
						setCurrentNetwork={setCurrentNetwork}
					/>
				)}
				{activeTab === 'nft' && (
					<NftTab
						currentNetwork={currentNetwork}
						walletAddress={currentAccount.address}
					/>
				)}
				{activeTab === 'settings' && (
					<OperationTab onLockWallet={onLockWallet} />
				)}
			</div>
		</div>
	)
}
