import { Connection, PublicKey } from '@solana/web3.js';
import { getMint, getAccount } from '@solana/spl-token';

const connection = new Connection(
  process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  'confirmed'
);

async function checkNftStatus(nftMintAddress: string, ownerAddress?: string) {
  console.log('🔍 Checking NFT status...\n');
  
  const mint = new PublicKey(nftMintAddress);
  
  try {
    // Get mint info (includes freeze authority)
    const mintInfo = await getMint(connection, mint);
    
    console.log('📋 Mint Information:');
    console.log('  Mint Address:', mint.toString());
    console.log('  Decimals:', mintInfo.decimals);
    console.log('  Supply:', mintInfo.supply.toString());
    console.log('  Mint Authority:', mintInfo.mintAuthority?.toString() || 'None (burned)');
    console.log('  Freeze Authority:', mintInfo.freezeAuthority?.toString() || 'None (no freeze authority)');
    
    if (ownerAddress) {
      // Get token account info
      const { getAssociatedTokenAddress } = await import('@solana/spl-token');
      const owner = new PublicKey(ownerAddress);
      const tokenAccount = await getAssociatedTokenAddress(mint, owner);
      
      try {
        const accountInfo = await getAccount(connection, tokenAccount);
        
        console.log('\n💼 Token Account Information:');
        console.log('  Token Account:', tokenAccount.toString());
        console.log('  Owner:', accountInfo.owner.toString());
        console.log('  Amount:', accountInfo.amount.toString());
        console.log('  Is Frozen:', accountInfo.state === 1 ? '❌ YES (FROZEN)' : '✅ NO (Active)');
        console.log('  State:', accountInfo.state === 0 ? 'Initialized' : accountInfo.state === 1 ? 'Frozen' : 'Unknown');
        
        if (accountInfo.state === 1) {
          console.log('\n⚠️  WARNING: This token account is FROZEN!');
          console.log('   To unfreeze, you need the freeze authority.');
          if (mintInfo.freezeAuthority) {
            console.log('   Freeze Authority:', mintInfo.freezeAuthority.toString());
            console.log('   Only this address can unfreeze the account.');
          } else {
            console.log('   ⚠️  No freeze authority set - this should not be possible!');
          }
        }
      } catch (error: any) {
        if (error.message?.includes('could not find account')) {
          console.log('\n💼 Token Account: Not found for this owner');
          console.log('   The owner may not have this NFT.');
        } else {
          console.error('Error fetching token account:', error.message);
        }
      }
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.message?.includes('could not find account')) {
      console.log('   The mint address may be invalid or not exist.');
    }
  }
}

// Get arguments from command line
const nftMint = process.argv[2];
const ownerAddress = process.argv[3];

if (!nftMint) {
  console.error('Usage: ts-node check-nft-status.ts <NFT_MINT_ADDRESS> [OWNER_ADDRESS]');
  console.error('Example: ts-node check-nft-status.ts 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
  process.exit(1);
}

checkNftStatus(nftMint, ownerAddress).catch(console.error);

