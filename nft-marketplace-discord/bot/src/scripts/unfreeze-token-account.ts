import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { thawAccount, getMint, getAccount } from '@solana/spl-token';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import * as fs from 'fs';
import * as path from 'path';

const connection = new Connection(
  process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  'confirmed'
);

async function unfreezeTokenAccount(
  nftMintAddress: string,
  ownerAddress: string,
  freezeAuthorityKeypairPath?: string
) {
  console.log('🔓 Attempting to unfreeze token account...\n');
  
  const mint = new PublicKey(nftMintAddress);
  const owner = new PublicKey(ownerAddress);
  
  try {
    // Get mint info to check freeze authority
    const mintInfo = await getMint(connection, mint);
    
    if (!mintInfo.freezeAuthority) {
      console.log('❌ This NFT has no freeze authority set.');
      console.log('   The account should not be frozen. This is unusual.');
      return;
    }
    
    console.log('📋 Mint Information:');
    console.log('  Freeze Authority:', mintInfo.freezeAuthority.toString());
    
    // Get token account
    const tokenAccount = await getAssociatedTokenAddress(mint, owner);
    const accountInfo = await getAccount(connection, tokenAccount);
    
    console.log('\n💼 Token Account:');
    console.log('  Address:', tokenAccount.toString());
    console.log('  State:', accountInfo.state === 1 ? 'FROZEN ❌' : 'Active ✅');
    
    if (accountInfo.state !== 1) {
      console.log('\n✅ Token account is already unfrozen!');
      return;
    }
    
    // Load freeze authority keypair
    let freezeAuthority: Keypair;
    
    if (freezeAuthorityKeypairPath) {
      // Load from provided path
      const keypairData = JSON.parse(fs.readFileSync(freezeAuthorityKeypairPath, 'utf-8'));
      freezeAuthority = Keypair.fromSecretKey(new Uint8Array(keypairData));
    } else {
      // Try to load from Solana CLI default location
      const defaultPath = path.join(process.env.HOME || '~', '.config/solana/id.json');
      if (fs.existsSync(defaultPath)) {
        const keypairData = JSON.parse(fs.readFileSync(defaultPath, 'utf-8'));
        freezeAuthority = Keypair.fromSecretKey(new Uint8Array(keypairData));
        console.log('📁 Using default Solana CLI keypair:', defaultPath);
      } else {
        throw new Error('Freeze authority keypair not found. Please provide path with --keypair option.');
      }
    }
    
    console.log('\n🔑 Freeze Authority Wallet:', freezeAuthority.publicKey.toString());
    
    // Verify this is the freeze authority
    if (!freezeAuthority.publicKey.equals(mintInfo.freezeAuthority)) {
      console.log('❌ ERROR: The provided keypair is not the freeze authority!');
      console.log('   Expected:', mintInfo.freezeAuthority.toString());
      console.log('   Got:', freezeAuthority.publicKey.toString());
      return;
    }
    
    // Unfreeze the account
    console.log('\n🔄 Unfreezing token account...');
    const signature = await thawAccount(
      connection,
      freezeAuthority,
      tokenAccount,
      mint,
      freezeAuthority
    );
    
    console.log('✅ Transaction sent:', signature);
    console.log('   View on Solscan:', `https://solscan.io/tx/${signature}?cluster=devnet`);
    
    // Verify it's unfrozen
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    const updatedAccount = await getAccount(connection, tokenAccount);
    
    if (updatedAccount.state !== 1) {
      console.log('\n✅ Success! Token account is now unfrozen.');
    } else {
      console.log('\n⚠️  Transaction sent but account still appears frozen. Check the transaction.');
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.message?.includes('could not find account')) {
      console.log('   The token account may not exist.');
    }
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
let nftMint: string | undefined;
let ownerAddress: string | undefined;
let keypairPath: string | undefined;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--keypair' && args[i + 1]) {
    keypairPath = args[i + 1];
    i++;
  } else if (!nftMint) {
    nftMint = args[i];
  } else if (!ownerAddress) {
    ownerAddress = args[i];
  }
}

if (!nftMint || !ownerAddress) {
  console.error('Usage: ts-node unfreeze-token-account.ts <NFT_MINT_ADDRESS> <OWNER_ADDRESS> [--keypair <PATH>]');
  console.error('\nExample:');
  console.error('  ts-node unfreeze-token-account.ts 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU <OWNER_ADDRESS>');
  console.error('  ts-node unfreeze-token-account.ts 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU <OWNER_ADDRESS> --keypair ~/.config/solana/id.json');
  process.exit(1);
}

unfreezeTokenAccount(nftMint, ownerAddress, keypairPath).catch(console.error);

