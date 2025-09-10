import type { UserNFT } from '../types/blockchain'

export const nftToStandardFormat = (nft: any): UserNFT => {
	return {
		tokenId: nft.tokenId,
		contract: nft.contract.address,
		name: nft.title || nft.metadata?.name || `NFT #${nft.tokenId}`,
		description: nft.description || nft.metadata?.description || '',
		image:
			nft.media[0]?.gateway ||
			nft.metadata?.image ||
			'https://via.placeholder.com/150',
		collection: nft.contract.name,
		chainId: parseInt(nft.contractMetadata?.chainId || '1'),
		tokenType: nft.tokenType
	}
}
