import React, { useEffect, useState } from 'react'

import { blockchainService } from '../services/BlockchainService'
import { Button } from './Button'
import { Card } from './Card'
import { ErrorAlert } from './ErrorAlert'
import { Input } from './Input'
import { LoadingSpinner } from './LoadingSpinner'

interface NFTCollection {
	contractAddress: string
	name: string
	symbol: string
	totalSupply: string
	tokenType: 'ERC721' | 'ERC1155'
}

interface NFTToken {
	tokenId: string
	name: string
	description: string
	image: string
	attributes: Array<{
		trait_type: string
		value: string | number
	}>
	contractAddress: string
	tokenType: 'ERC721' | 'ERC1155'
}

interface NFTViewerProps {
	walletAddress: string
	currentNetwork: string
}

export const NftTab: React.FC<NFTViewerProps> = ({
	walletAddress,
	currentNetwork
}) => {
	const [collections, setCollections] = useState<NFTCollection[]>([])
	const [nfts, setNfts] = useState<NFTToken[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [selectedCollection, setSelectedCollection] = useState<string | null>(
		null
	)
	const [customContract, setCustomContract] = useState('')

	// 模拟的 NFT 数据 - 在实际应用中，这些数据会从区块链或 NFT API 获取
	const mockCollections: NFTCollection[] = [
		{
			contractAddress: '0x1234567890123456789012345678901234567890',
			name: 'CryptoPunks',
			symbol: 'PUNK',
			totalSupply: '10000',
			tokenType: 'ERC721'
		},
		{
			contractAddress: '0x2345678901234567890123456789012345678901',
			name: 'Bored Ape Yacht Club',
			symbol: 'BAYC',
			totalSupply: '10000',
			tokenType: 'ERC721'
		}
	]

	const mockNFTs: NFTToken[] = [
		{
			tokenId: '1234',
			name: 'CryptoPunk #1234',
			description: 'A unique digital collectible',
			image: 'https://via.placeholder.com/300x300/4F46E5/FFFFFF?text=CryptoPunk+1234',
			attributes: [
				{ trait_type: 'Type', value: 'Male' },
				{ trait_type: 'Accessory', value: 'Earring' },
				{ trait_type: 'Expression', value: 'Smile' }
			],
			contractAddress: '0x1234567890123456789012345678901234567890',
			tokenType: 'ERC721'
		},
		{
			tokenId: '5678',
			name: 'Bored Ape #5678',
			description: 'A unique digital collectible from BAYC',
			image: 'https://via.placeholder.com/300x300/10B981/FFFFFF?text=BAYC+5678',
			attributes: [
				{ trait_type: 'Background', value: 'Blue' },
				{ trait_type: 'Fur', value: 'Brown' },
				{ trait_type: 'Eyes', value: 'Sleepy' }
			],
			contractAddress: '0x2345678901234567890123456789012345678901',
			tokenType: 'ERC721'
		}
	]

	useEffect(() => {
		loadNFTCollections()
	}, [walletAddress])

	const loadNFTCollections = async () => {
		try {
			setIsLoading(true)
			setError(null)

			// 在实际应用中，这里会调用 NFT API 或智能合约
			// const res = await blockchainService.getNfts(walletAddress)
			// 目前使用模拟数据
			await new Promise((resolve) => setTimeout(resolve, 1000))

			setCollections(mockCollections)
			setNfts(mockNFTs)
		} catch (err: any) {
			setError(err.message)
		} finally {
			setIsLoading(false)
		}
	}

	const loadNFTsFromContract = async (contractAddress: string) => {
		try {
			setIsLoading(true)
			setError(null)

			// 在实际应用中，这里会调用智能合约获取 NFT 数据
			await new Promise((resolve) => setTimeout(resolve, 1000))

			const contractNFTs = mockNFTs.filter(
				(nft) => nft.contractAddress === contractAddress
			)
			setNfts(contractNFTs)
			setSelectedCollection(contractAddress)
		} catch (err: any) {
			setError(err.message)
		} finally {
			setIsLoading(false)
		}
	}

	const loadCustomContract = () => {
		if (!customContract.trim()) {
			setError('请输入合约地址')
			return
		}

		loadNFTsFromContract(customContract)
	}

	const formatAddress = (address: string) => {
		return `${address.slice(0, 6)}...${address.slice(-4)}`
	}

	return (
		<div className="space-y-6">
			{error && (
				<ErrorAlert
					error={error}
					onDismiss={() => setError(null)}
					showDismiss={true}
				/>
			)}

			{/* 搜索自定义合约 */}
			<Card>
				<h3 className="text-lg font-semibold mb-4">搜索 NFT 合约</h3>
				<div className="flex space-x-2">
					<Input
						value={customContract}
						onChange={(value) => setCustomContract(value)}
						placeholder="0x..."
						className="flex-1"
					/>
					<Button
						onClick={loadCustomContract}
						disabled={isLoading || !customContract.trim()}>
						{isLoading ? <LoadingSpinner size="small" /> : '🔍搜索'}
					</Button>
				</div>
			</Card>

			{/* NFT 集合列表 */}
			<Card>
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-semibold">我的 NFT 集合</h3>
					<Button
						onClick={loadNFTCollections}
						disabled={isLoading}
						variant="secondary"
						size="sm">
						{isLoading ? <LoadingSpinner size="small" /> : '🔄刷新'}
					</Button>
				</div>

				{isLoading && collections.length === 0 ? (
					<div className="flex items-center justify-center py-8">
						<LoadingSpinner size="small" />
						<span className="ml-2 text-gray-500">
							加载 NFT 集合中...
						</span>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{collections.map((collection) => (
							<div className="flex items-center space-x-3">
								<div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center text-white font-bold">
									{collection.symbol.charAt(0)}
								</div>
								<div className="flex-1">
									<h4 className="font-medium text-gray-900">
										{collection.name}
									</h4>
									<p className="text-xs text-gray-400">
										{formatAddress(
											collection.contractAddress
										)}
									</p>
								</div>
							</div>
						))}
					</div>
				)}
			</Card>

			{/* NFT 列表 */}
			{selectedCollection && (
				<Card>
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-lg font-semibold">NFT 列表</h3>
						<span className="text-sm text-gray-500">
							共 {nfts.length} 个 NFT
						</span>
					</div>

					{isLoading ? (
						<div className="flex items-center justify-center py-8">
							<LoadingSpinner size="small" />
							<span className="ml-2 text-gray-500">
								加载 NFT 中...
							</span>
						</div>
					) : nfts.length === 0 ? (
						<div className="text-center py-8 text-gray-500">
							<div className="text-4xl mb-2">🖼️</div>
							<p>此集合中没有找到 NFT</p>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{nfts.map((nft) => (
								<div
									key={`${nft.contractAddress}-${nft.tokenId}`}
									className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
									<div className="aspect-square bg-gray-100">
										<img
											src={nft.image}
											alt={nft.name}
											className="w-full h-full object-cover"
											onError={(e) => {
												const target =
													e.target as HTMLImageElement
												target.src =
													'https://via.placeholder.com/300x300/6B7280/FFFFFF?text=NFT'
											}}
										/>
									</div>
									<div className="p-4">
										<h4 className="font-medium text-gray-900 truncate">
											{nft.name}
										</h4>
										<p className="text-sm text-gray-500 mt-1 line-clamp-2">
											{nft.description}
										</p>
										<div className="mt-3">
											<p className="text-xs text-gray-400">
												Token ID: {nft.tokenId}
											</p>
											<p className="text-xs text-gray-400">
												{nft.tokenType}
											</p>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</Card>
			)}

			{/* 功能说明 */}
			<Card>
				<h3 className="text-lg font-semibold mb-4">NFT 功能说明</h3>
				<div className="text-sm text-gray-600 space-y-2">
					<p>
						• <strong>查看 NFT</strong>: 浏览您钱包中的 NFT 收藏
					</p>
					<p>
						• <strong>搜索合约</strong>: 通过合约地址查看特定集合的
						NFT
					</p>
					<p>
						• <strong>支持标准</strong>: 支持 ERC-721 和 ERC-1155
						标准
					</p>
					<p>
						• <strong>元数据</strong>: 显示 NFT 的属性和详细信息
					</p>
					<p>
						• <strong>即将推出</strong>: NFT 发送、接收和交易功能
					</p>
				</div>
			</Card>
		</div>
	)
}
