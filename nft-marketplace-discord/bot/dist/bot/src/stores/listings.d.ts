export interface ListingData {
    listingAddress: string;
    sellerDiscordId: string;
    sellerUsername: string;
    sellerWallet: string;
    nftMint: string;
    price: number;
    status: 'active' | 'sold' | 'cancelled';
    createdAt: Date;
    txHash: string;
}
export declare const listings: Map<string, ListingData>;
export declare function addListing(data: ListingData): void;
export declare function getListing(listingAddress: string): ListingData | undefined;
export declare function updateListingStatus(listingAddress: string, status: 'active' | 'sold' | 'cancelled'): void;
//# sourceMappingURL=listings.d.ts.map