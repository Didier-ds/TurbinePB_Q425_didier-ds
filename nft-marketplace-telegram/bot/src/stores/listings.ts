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

// In-memory store (will be replaced with MongoDB later)
export const listings = new Map<string, ListingData>();

export function addListing(data: ListingData) {
  listings.set(data.listingAddress, data);
}

export function getListing(listingAddress: string) {
  return listings.get(listingAddress);
}

export function updateListingStatus(listingAddress: string, status: 'active' | 'sold' | 'cancelled') {
  const listing = listings.get(listingAddress);
  if (listing) {
    listing.status = status;
  }
}
