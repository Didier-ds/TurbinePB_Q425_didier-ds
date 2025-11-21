import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';

const connection = new Connection('http://127.0.0.1:8899', 'confirmed');

async function createTestNFT(walletAddress: string) {
  console.log('Creating test NFT for wallet:', walletAddress);

  // Create a payer keypair (we'll airdrop SOL to it)
  const payer = Keypair.generate();

  // Airdrop SOL to payer
  console.log('Airdropping SOL to payer...');
  const airdropSig = await connection.requestAirdrop(payer.publicKey, 2 * LAMPORTS_PER_SOL);
  await connection.confirmTransaction(airdropSig);

  // Create NFT mint (decimals = 0 for NFT)
  console.log('Creating NFT mint...');
  const mint = await createMint(
    connection,
    payer,
    payer.publicKey,  // mint authority
    null,             // freeze authority
    0                 // decimals (0 for NFT)
  );
  console.log('NFT Mint:', mint.toString());

  // Get or create token account for the recipient
  const recipient = new PublicKey(walletAddress);
  console.log('Creating token account for recipient...');
  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    recipient
  );
  console.log('Token Account:', tokenAccount.address.toString());

  // Mint 1 NFT to recipient
  console.log('Minting NFT...');
  await mintTo(
    connection,
    payer,
    mint,
    tokenAccount.address,
    payer.publicKey,
    1
  );

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
