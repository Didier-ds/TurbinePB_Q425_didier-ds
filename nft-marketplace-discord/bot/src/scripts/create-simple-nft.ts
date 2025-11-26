import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Use devnet by default (same as marketplace)
const connection = new Connection(
  process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  'confirmed'
);

async function createSimpleNFT(walletAddress: string) {
  console.log('🎨 Creating a fresh NFT for marketplace...\n');
  console.log('Recipient wallet:', walletAddress);

  // Load wallet from Solana CLI config (or use provided keypair)
  let payer: Keypair;
  const walletPath = path.join(process.env.HOME || '~', '.config/solana/id.json');
  
  if (fs.existsSync(walletPath)) {
    console.log('📁 Loading wallet from:', walletPath);
    const keypairData = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));
    payer = Keypair.fromSecretKey(new Uint8Array(keypairData));
  } else {
    console.log('⚠️  No wallet found, generating temporary keypair...');
    payer = Keypair.generate();
    console.log('   You\'ll need to airdrop SOL to:', payer.publicKey.toString());
  }

  console.log('💰 Payer wallet:', payer.publicKey.toString());

  // Check balance
  const balance = await connection.getBalance(payer.publicKey);
  console.log('   Balance:', (balance / LAMPORTS_PER_SOL).toFixed(4), 'SOL');

  if (balance < 0.01 * LAMPORTS_PER_SOL) {
    console.log('\n⚠️  Low balance! Requesting airdrop...');
    try {
      const airdropSig = await connection.requestAirdrop(
        payer.publicKey,
        1 * LAMPORTS_PER_SOL
      );
      await connection.confirmTransaction(airdropSig);
      console.log('✅ Airdrop received!');
    } catch (error) {
      console.log('❌ Airdrop failed. Please manually airdrop SOL to:', payer.publicKey.toString());
      console.log('   Run: solana airdrop 1', payer.publicKey.toString(), '--url devnet');
    }
  }

  // Create NFT mint (decimals = 0 for NFT, freeze authority = null)
  console.log('\n🪙 Creating NFT mint...');
  const mint = await createMint(
    connection,
    payer,
    payer.publicKey,  // mint authority
    null,             // freeze authority = null (no one can freeze!)
    0                 // decimals (0 for NFT)
  );
  console.log('✅ NFT Mint created:', mint.toString());

  // Get or create token account for the recipient
  const recipient = new PublicKey(walletAddress);
  console.log('\n💼 Creating token account for recipient...');
  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    recipient
  );
  console.log('✅ Token Account:', tokenAccount.address.toString());

  // Mint 1 NFT to recipient
  console.log('\n🎯 Minting NFT to recipient...');
  await mintTo(
    connection,
    payer,
    mint,
    tokenAccount.address,
    payer.publicKey,
    1
  );

  console.log('\n' + '='.repeat(60));
  console.log('✅ NFT CREATED SUCCESSFULLY!');
  console.log('='.repeat(60));
  console.log('📋 NFT Mint Address:', mint.toString());
  console.log('👤 Owner:', walletAddress);
  console.log('💼 Token Account:', tokenAccount.address.toString());
  console.log('🔒 Freeze Authority: None (cannot be frozen)');
  console.log('\n📝 Use this mint address with /list command:');
  console.log(`   /list mint:${mint.toString()} price:1.5`);
  console.log('\n🔗 View on Solscan:');
  console.log(`   https://solscan.io/token/${mint.toString()}?cluster=devnet`);

  return mint.toString();
}

// Get wallet address from command line
const walletAddress = process.argv[2];

if (!walletAddress) {
  console.error('❌ Usage: ts-node create-simple-nft.ts <WALLET_ADDRESS>');
  console.error('\nExample:');
  console.error('  ts-node create-simple-nft.ts CmFMw9z5FhzB6Sfpm3L6QYpiAuXSGJqnScH75pa1yWqj');
  console.error('\n💡 Get your wallet address from Discord: /wallet');
  process.exit(1);
}

createSimpleNFT(walletAddress).catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});

