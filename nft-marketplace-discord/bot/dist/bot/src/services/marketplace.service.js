"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connection = void 0;
exports.listNft = listNft;
exports.buyNft = buyNft;
exports.cancelListing = cancelListing;
exports.getListing = getListing;
exports.getAllListings = getAllListings;
const web3_js_1 = require("@solana/web3.js");
const anchor_1 = require("@coral-xyz/anchor");
const spl_token_1 = require("@solana/spl-token");
// Load IDL
const nft_marketplace_json_1 = __importDefault(require("../../../target/idl/nft_marketplace.json"));
const PROGRAM_ID = new web3_js_1.PublicKey(process.env.NFT_MARKETPLACE_PROGRAM_ID || '67AAvxuwtST6foKb3141DAy4eUGnUFVZYERKEBytu5sc');
const connection = new web3_js_1.Connection(process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com', 'confirmed');
exports.connection = connection;
// Helper to get keypair from stored wallet
function getKeypair(secretKeyBase64) {
    const secretKey = Buffer.from(secretKeyBase64, 'base64');
    return web3_js_1.Keypair.fromSecretKey(secretKey);
}
// Get program instance with wallet
function getProgram(wallet) {
    const keypair = getKeypair(wallet.secretKey);
    const anchorWallet = new anchor_1.Wallet(keypair);
    const provider = new anchor_1.AnchorProvider(connection, anchorWallet, {
        commitment: 'confirmed',
    });
    return new anchor_1.Program(nft_marketplace_json_1.default, provider);
}
// Derive listing PDA
function getListingPDA(seller, nftMint) {
    return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from('listing'), seller.toBuffer(), nftMint.toBuffer()], PROGRAM_ID);
}
// Derive escrow PDA
function getEscrowPDA(listing) {
    return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from('escrow'), listing.toBuffer()], PROGRAM_ID);
}
// List NFT for sale
async function listNft(wallet, nftMint, priceInSol) {
    const program = getProgram(wallet);
    const seller = new web3_js_1.PublicKey(wallet.publicKey);
    const nftMintPubkey = new web3_js_1.PublicKey(nftMint);
    // Get seller's token account for the NFT
    const sellerTokenAccount = await (0, spl_token_1.getAssociatedTokenAddress)(nftMintPubkey, seller);
    // Derive PDAs
    const [listing] = getListingPDA(seller, nftMintPubkey);
    const [escrowTokenAccount] = getEscrowPDA(listing);
    // Convert SOL to lamports
    const priceInLamports = new anchor_1.BN(priceInSol * web3_js_1.LAMPORTS_PER_SOL);
    // Call the smart contract
    const txHash = await (program.methods)
        .listNft(priceInLamports)
        .accounts({
        seller: seller,
        nftMint: nftMintPubkey,
        sellerTokenAccount: sellerTokenAccount,
    })
        .rpc();
    return {
        txHash,
        listingAddress: listing.toString(),
    };
}
// Buy NFT
async function buyNft(wallet, listingAddress) {
    const program = getProgram(wallet);
    const buyer = new web3_js_1.PublicKey(wallet.publicKey);
    const listing = new web3_js_1.PublicKey(listingAddress);
    // Fetch listing data to get seller and nft_mint
    const listingAccount = await program.account.listing.fetch(listing);
    const seller = listingAccount.seller;
    const nftMint = listingAccount.nftMint;
    // Get buyer's token account for the NFT
    const buyerTokenAccount = await (0, spl_token_1.getAssociatedTokenAddress)(nftMint, buyer);
    // Derive escrow PDA
    const [escrowTokenAccount] = getEscrowPDA(listing);
    // Call the smart contract
    const txHash = await program.methods
        .buyNft()
        .accounts({
        buyer: buyer,
        seller: seller,
        listing: listing,
        escrowTokenAccount: escrowTokenAccount,
        buyerTokenAccount: buyerTokenAccount,
        tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        systemProgram: web3_js_1.PublicKey.default,
    })
        .rpc();
    return { txHash };
}
// Cancel listing
async function cancelListing(wallet, listingAddress) {
    const program = getProgram(wallet);
    const seller = new web3_js_1.PublicKey(wallet.publicKey);
    const listing = new web3_js_1.PublicKey(listingAddress);
    // Fetch listing data
    const listingAccount = await program.account.listing.fetch(listing);
    const nftMint = listingAccount.nftMint;
    // Get seller's token account
    const sellerTokenAccount = await (0, spl_token_1.getAssociatedTokenAddress)(nftMint, seller);
    // Derive escrow PDA
    const [escrowTokenAccount] = getEscrowPDA(listing);
    // Call the smart contract
    const txHash = await program.methods
        .cancelListing()
        .accounts({
        seller: seller,
        listing: listing,
        escrowTokenAccount: escrowTokenAccount,
        sellerTokenAccount: sellerTokenAccount,
        tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
    })
        .rpc();
    return { txHash };
}
// Fetch listing data
async function getListing(listingAddress) {
    const program = getProgram({ publicKey: '', secretKey: '' });
    const listing = new web3_js_1.PublicKey(listingAddress);
    try {
        const account = await program.account.listing.fetch(listing);
        return {
            seller: account.seller.toString(),
            nftMint: account.nftMint.toString(),
            price: account.priceSol.toNumber() / web3_js_1.LAMPORTS_PER_SOL,
            isActive: account.isActive,
            createdAt: account.createdAt.toNumber(),
        };
    }
    catch {
        return null;
    }
}
// Fetch all active listings from blockchain
async function getAllListings() {
    // Create a read-only program instance
    const keypair = web3_js_1.Keypair.generate(); // Dummy keypair for reading
    const wallet = new anchor_1.Wallet(keypair);
    const provider = new anchor_1.AnchorProvider(connection, wallet, { commitment: 'confirmed' });
    const program = new anchor_1.Program(nft_marketplace_json_1.default, provider);
    try {
        // Fetch all listing accounts
        const accounts = await program.account.listing.all();
        return accounts
            .filter((acc) => acc.account.isActive) // Only active listings
            .map((acc) => ({
            listingAddress: acc.publicKey.toString(),
            seller: acc.account.seller.toString(),
            nftMint: acc.account.nftMint.toString(),
            price: acc.account.priceSol.toNumber() / web3_js_1.LAMPORTS_PER_SOL,
            isActive: acc.account.isActive,
            createdAt: acc.account.createdAt.toNumber(),
        }));
    }
    catch (error) {
        console.error('Error fetching listings:', error);
        return [];
    }
}
//# sourceMappingURL=marketplace.service.js.map