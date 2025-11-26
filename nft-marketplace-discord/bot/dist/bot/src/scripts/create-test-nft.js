"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const connection = new web3_js_1.Connection('http://127.0.0.1:8899', 'confirmed');
async function createTestNFT(walletAddress) {
    console.log('Creating test NFT for wallet:', walletAddress);
    // Create a payer keypair (we'll airdrop SOL to it)
    const payer = web3_js_1.Keypair.generate();
    // Airdrop SOL to payer
    console.log('Airdropping SOL to payer...');
    const airdropSig = await connection.requestAirdrop(payer.publicKey, 2 * web3_js_1.LAMPORTS_PER_SOL);
    await connection.confirmTransaction(airdropSig);
    // Create NFT mint (decimals = 0 for NFT)
    console.log('Creating NFT mint...');
    const mint = await (0, spl_token_1.createMint)(connection, payer, payer.publicKey, // mint authority
    null, // freeze authority
    0 // decimals (0 for NFT)
    );
    console.log('NFT Mint:', mint.toString());
    // Get or create token account for the recipient
    const recipient = new web3_js_1.PublicKey(walletAddress);
    console.log('Creating token account for recipient...');
    const tokenAccount = await (0, spl_token_1.getOrCreateAssociatedTokenAccount)(connection, payer, mint, recipient);
    console.log('Token Account:', tokenAccount.address.toString());
    // Mint 1 NFT to recipient
    console.log('Minting NFT...');
    await (0, spl_token_1.mintTo)(connection, payer, mint, tokenAccount.address, payer.publicKey, 1);
    console.log('\n✅ Test NFT created!');
    console.log('NFT Mint Address:', mint.toString());
    console.log('Use this mint address with /list command');
    return mint.toString();
}
// Get wallet address from command line
const walletAddress = process.argv[2];
if (!walletAddress) {
    console.error('Usage: ts-node create-test-nft.ts <WALLET_ADDRESS>');
    process.exit(1);
}
createTestNFT(walletAddress).catch(console.error);
//# sourceMappingURL=create-test-nft.js.map