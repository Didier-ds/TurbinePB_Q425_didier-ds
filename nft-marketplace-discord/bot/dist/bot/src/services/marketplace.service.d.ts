import { Connection } from '@solana/web3.js';
import idl from '../../../target/idl/nft_marketplace.json';
export type MyProgram = typeof idl;
declare const connection: Connection;
export declare function listNft(wallet: {
    publicKey: string;
    secretKey: string;
}, nftMint: string, priceInSol: number): Promise<{
    txHash: string;
    listingAddress: string;
}>;
export declare function buyNft(wallet: {
    publicKey: string;
    secretKey: string;
}, listingAddress: string): Promise<{
    txHash: string;
}>;
export declare function cancelListing(wallet: {
    publicKey: string;
    secretKey: string;
}, listingAddress: string): Promise<{
    txHash: string;
}>;
export declare function getListing(listingAddress: string): Promise<{
    seller: string;
    nftMint: string;
    price: number;
    isActive: any;
    createdAt: number;
} | null>;
export declare function getAllListings(): Promise<any>;
export { connection };
//# sourceMappingURL=marketplace.service.d.ts.map