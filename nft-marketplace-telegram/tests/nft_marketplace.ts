import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { NftMarketplace } from "../target/types/nft_marketplace";
import {
  createMint,
  createAccount,
  mintTo,
  getAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert } from "chai";

describe("nft_marketplace", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.nftMarketplace as Program<NftMarketplace>;

  // Test accounts
  let seller: Keypair;
  let nftMint: PublicKey;
  let sellerTokenAccount: PublicKey;
  let listing: PublicKey;
  let escrowTokenAccount: PublicKey;

  const priceInSol = new anchor.BN(1 * LAMPORTS_PER_SOL); // 1 SOL

  before(async () => {
    // Airdrop SOL to seller for testing
    seller = Keypair.generate();
    const airdropSig = await provider.connection.requestAirdrop(
      seller.publicKey,
      10 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSig);
  });

  it("Lists an NFT for sale", async () => {
    // Create NFT mint (supply = 1 for NFT)
    nftMint = await createMint(
      provider.connection,
      seller,
      seller.publicKey, // mint authority
      null, // freeze authority
      0 // decimals = 0 for NFT
    );
    console.log("NFT Mint:", nftMint.toBase58());

    // Create seller's token account
    sellerTokenAccount = await createAccount(
      provider.connection,
      seller,
      nftMint,
      seller.publicKey
    );
    console.log("Seller Token Account:", sellerTokenAccount.toBase58());

    // Mint the NFT to seller (amount = 1)
    await mintTo(
      provider.connection,
      seller,
      nftMint,
      sellerTokenAccount,
      seller.publicKey,
      1
    );

    // Verify seller has the NFT
    const sellerTokenAccountInfo = await getAccount(
      provider.connection,
      sellerTokenAccount
    );
    assert.equal(sellerTokenAccountInfo.amount.toString(), "1");

    // Derive PDA for listing account
    [listing] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("listing"),
        seller.publicKey.toBuffer(),
        nftMint.toBuffer(),
      ],
      program.programId
    );

    // Derive PDA for escrow token account
    [escrowTokenAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), listing.toBuffer()],
      program.programId
    );

    console.log("Listing PDA:", listing.toBase58());
    console.log("Escrow Token Account PDA:", escrowTokenAccount.toBase58());

    // Call list_nft instruction
    const tx = await program.methods
      .listNft(priceInSol)
      .accounts({
        seller: seller.publicKey,
        nftMint: nftMint,
        sellerTokenAccount: sellerTokenAccount,
        listing: listing,
        escrowTokenAccount: escrowTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([seller])
      .rpc();

    console.log("List NFT transaction signature:", tx);

    // Verify listing account data
    const listingAccount = await program.account.listing.fetch(listing);
    assert.equal(listingAccount.seller.toBase58(), seller.publicKey.toBase58());
    assert.equal(listingAccount.nftMint.toBase58(), nftMint.toBase58());
    assert.equal(
      listingAccount.nftTokenAccount.toBase58(),
      escrowTokenAccount.toBase58()
    );
    assert.equal(listingAccount.priceSol.toString(), priceInSol.toString());
    assert.isTrue(listingAccount.isActive);
    console.log("✓ Listing created successfully");

    // Verify NFT was transferred to escrow
    const escrowTokenAccountInfo = await getAccount(
      provider.connection,
      escrowTokenAccount
    );
    assert.equal(escrowTokenAccountInfo.amount.toString(), "1");
    assert.equal(
      escrowTokenAccountInfo.owner.toBase58(),
      listing.toBase58()
    );
    console.log("✓ NFT transferred to escrow");

    // Verify seller's token account is now empty
    const sellerTokenAccountInfoAfter = await getAccount(
      provider.connection,
      sellerTokenAccount
    );
    assert.equal(sellerTokenAccountInfoAfter.amount.toString(), "0");
    console.log("✓ Seller's token account emptied");
  });

  it("Fails to list NFT with invalid amount", async () => {
    // Create a fungible token (not an NFT)
    const fungibleMint = await createMint(
      provider.connection,
      seller,
      seller.publicKey,
      null,
      2 // decimals > 0
    );

    const fungibleTokenAccount = await createAccount(
      provider.connection,
      seller,
      fungibleMint,
      seller.publicKey
    );

    // Mint 100 tokens (not 1)
    await mintTo(
      provider.connection,
      seller,
      fungibleMint,
      fungibleTokenAccount,
      seller.publicKey,
      100
    );

    const [invalidListing] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("listing"),
        seller.publicKey.toBuffer(),
        fungibleMint.toBuffer(),
      ],
      program.programId
    );

    const [invalidEscrow] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), invalidListing.toBuffer()],
      program.programId
    );

    try {
      await program.methods
        .listNft(priceInSol)
        .accounts({
          seller: seller.publicKey,
          nftMint: fungibleMint,
          sellerTokenAccount: fungibleTokenAccount,
          listing: invalidListing,
          escrowTokenAccount: invalidEscrow,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([seller])
        .rpc();

      assert.fail("Should have failed with InvalidNFT error");
    } catch (error) {
      assert.include(error.message, "InvalidNFT");
      console.log("✓ Correctly rejected non-NFT token");
    }
  });
});
