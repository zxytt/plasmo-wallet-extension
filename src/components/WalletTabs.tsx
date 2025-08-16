import React, { useState } from 'react'
import { MainWallet } from './MainWallet'
import { BlockchainServiceTest } from './BlockchainServiceTest'

interface WalletTabsProps {
  currentAccount: {
    address: string
    privateKey: string
    mnemonic?: string
  }
  onLockWallet: () => void
}

type TabType = 'wallet' | 'test'

export const WalletTabs: React.FC<WalletTabsProps> = ({ currentAccount, onLockWallet }) => {
  const [activeTab, setActiveTab] = useState<TabType>('wallet')

  const tabs = [
    { id: 'wallet' as TabType, label: '钱包', icon: '👛' },
    { id: 'test' as TabType, label: '区块链测试', icon: '🧪' },
  ]

  return (
    <div className="h-full flex flex-col">
      {/* 标签页导航 */}
      <div className="flex border-b border-gray-200 bg-white">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* 标签页内容 */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'wallet' && (
          <MainWallet 
            currentAccount={currentAccount} 
            onLockWallet={onLockWallet} 
          />
        )}
        {activeTab === 'test' && (
          <BlockchainServiceTest />
        )}
      </div>
    </div>
  )
}