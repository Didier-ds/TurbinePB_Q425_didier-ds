import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet, BN, Idl } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';

// Load IDL
import idl from '../../../target/idl/nft_marketplace.json';
import NftMarketplace from "../../../target/types/nft_marketplace"

export type MyProgram = typeof idl;
const PROGRAM_ID = new PublicKey(process.env.NFT_MARKETPLACE_PROGRAM_ID || '67AAvxuwtST6foKb3141DAy4eUGnUFVZYERKEBytu5sc');

const connection = new Connection(
  process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  'confirmed'
);

// Helper to get keypair from stored wallet
function getKeypair(secretKeyBase64: string): Keypair {
  const secretKey = Buffer.from(secretKeyBase64, 'base64');
  return Keypair.fromSecretKey(secretKey);
}

// Get program instance with wallet
function getProgram(wallet: { publicKey: string; secretKey: string }) {
  const keypair = getKeypair(wallet.secretKey);
  const anchorWallet = new Wallet(keypair);
  const provider = new AnchorProvider(connection, anchorWallet, {
    commitment: 'confirmed',
  });

  return new Program(idl as NftMarketplace, provider);
}

// Derive listing PDA
function getListingPDA(seller: PublicKey, nftMint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('listing'), seller.toBuffer(), nftMint.toBuffer()],
    PROGRAM_ID
  );
}

// Derive escrow PDA
function getEscrowPDA(listing: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('escrow'), listing.toBuffer()],
    PROGRAM_ID
  );
}

// List NFT for sale
export async function listNft(
  wallet: { publicKey: string; secretKey: string },
  nftMint: string,
  priceInSol: number
): Promise<{ txHash: string; listingAddress: string }> {
  const program = getProgram(wallet);
  const seller = new PublicKey(wallet.publicKey);
  const nftMintPubkey = new PublicKey(nftMint);

  // Get seller's token account for the NFT
  const sellerTokenAccount = await getAssociatedTokenAddress(
    nftMintPubkey,
    seller
  );

  // Derive PDAs
  const [listing] = getListingPDA(seller, nftMintPubkey);
  const [escrowTokenAccount] = getEscrowPDA(listing);

  // Convert SOL to lamports
  const priceInLamports = new BN(priceInSol * LAMPORTS_PER_SOL);

  // Call the smart contract
  const txHash = await (program.methods)
    .listNft(priceInLamports)
    .accounts({
      seller: seller,
      nftMint: nftMintPubkey,
      sellerTokenAccount: sellerTokenAccount,
      listing: listing,
      escrowTokenAccount: escrowTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: PublicKey.default,
    })
    .rpc();

  return {
    txHash,
    listingAddress: listing.toString(),
  };
}

// Buy NFT
export async function buyNft(
  wallet: { publicKey: string; secretKey: string },
  listingAddress: string
): Promise<{ txHash: string }> {
  const program = getProgram(wallet);
  const buyer = new PublicKey(wallet.publicKey);
  const listing = new PublicKey(listingAddress);

  // Fetch listing data to get seller and nft_mint
  const listingAccount = await (program.account as any).listing.fetch(listing);
  const seller = listingAccount.seller as PublicKey;
  const nftMint = listingAccount.nftMint as PublicKey;

  // Get buyer's token account for the NFT
  const buyerTokenAccount = await getAssociatedTokenAddress(nftMint, buyer);

  // Derive escrow PDA
  const [escrowTokenAccount] = getEscrowPDA(listing);

  // Call the smart contract
  const txHash = await (program.methods as any)
    .buyNft()
    .accounts({
      buyer: buyer,
      seller: seller,
      listing: listing,
      escrowTokenAccount: escrowTokenAccount,
      buyerTokenAccount: buyerTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: PublicKey.default,
    })
    .rpc();

  return { txHash };
}

// Cancel listing
export async function cancelListing(
  wallet: { publicKey: string; secretKey: string },
  listingAddress: string
): Promise<{ txHash: string }> {
  const program = getProgram(wallet);
  const seller = new PublicKey(wallet.publicKey);
  const listing = new PublicKey(listingAddress);

  // Fetch listing data
  const listingAccount = await (program.account as any).listing.fetch(listing);
  const nftMint = listingAccount.nftMint as PublicKey;

  // Get seller's token account
  const sellerTokenAccount = await getAssociatedTokenAddress(nftMint, seller);

  // Derive escrow PDA
  const [escrowTokenAccount] = getEscrowPDA(listing);

  // Call the smart contract
  const txHash = await (program.methods as any)
    .cancelListing()
    .accounts({
      seller: seller,
      listing: listing,
      escrowTokenAccount: escrowTokenAccount,
      sellerTokenAccount: sellerTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();

  return { txHash };
}

// Fetch listing data
export async function getListing(listingAddress: string) {
  const program = getProgram({ publicKey: '', secretKey: '' });
  const listing = new PublicKey(listingAddress);

  try {
    const account = await (program.account as any).listing.fetch(listing);
    return {
      seller: (account.seller as PublicKey).toString(),
      nftMint: (account.nftMint as PublicKey).toString(),
      price: (account.priceSol as BN).toNumber() / LAMPORTS_PER_SOL,
      isActive: account.isActive,
      createdAt: (account.createdAt as BN).toNumber(),
    };
  } catch {
    return null;
  }
}

// Fetch all active listings from blockchain
export async function getAllListings() {
  // Create a read-only program instance
  const keypair = Keypair.generate(); // Dummy keypair for reading
  const wallet = new Wallet(keypair);
  const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
  const program = new Program(idl as Idl, provider);

  try {
    // Fetch all listing accounts
    const accounts = await (program.account as any).listing.all();

    return accounts
      .filter((acc: any) => acc.account.isActive) // Only active listings
      .map((acc: any) => ({
        listingAddress: acc.publicKey.toString(),
        seller: acc.account.seller.toString(),
        nftMint: acc.account.nftMint.toString(),
        price: acc.account.priceSol.toNumber() / LAMPORTS_PER_SOL,
        isActive: acc.account.isActive,
        createdAt: acc.account.createdAt.toNumber(),
      }));
  } catch (error) {
    console.error('Error fetching listings:', error);
    return [];
  }
}

export { connection };
