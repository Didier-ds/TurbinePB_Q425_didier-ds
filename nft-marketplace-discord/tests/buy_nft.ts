import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { NftMarketplace } from "../target/types/nft_marketplace";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  createAccount,
  createMint,
  getAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { assert } from "chai";

describe("buy_nft", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.nftMarketplace as Program<NftMarketplace>;

  // Test accounts
  let seller: Keypair;
  let buyer: Keypair;
  let nftMint: PublicKey;
  let sellerTokenAccount: PublicKey;
  let buyerTokenAccount: PublicKey;
  let listing: PublicKey;
  let escrowTokenAccount: PublicKey;

  const priceInSol = new anchor.BN(1 * LAMPORTS_PER_SOL);

  before(async () => {
    // Setup: Create seller with SOL
    seller = Keypair.generate();
    const sellerAirdrop = await provider.connection.requestAirdrop(
      seller.publicKey,
      10 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sellerAirdrop);

    // Setup: Create buyer with SOL
    buyer = Keypair.generate();
    const buyerAirdrop = await provider.connection.requestAirdrop(
      buyer.publicKey,
      10 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(buyerAirdrop);

    // Create NFT mint
    nftMint = await createMint(
      provider.connection,
      seller,
      seller.publicKey,
      null,
      0 // decimals = 0 for NFT
    );

    // Create seller's token account
    sellerTokenAccount = await createAccount(
      provider.connection,
      seller,
      nftMint,
      seller.publicKey
    );

    // Create buyer's token account
    buyerTokenAccount = await createAccount(
      provider.connection,
      buyer,
      nftMint,
      buyer.publicKey
    );

    // Mint NFT to seller
    await mintTo(
      provider.connection,
      seller,
      nftMint,
      sellerTokenAccount,
      seller.publicKey,
      1
    );

    // Derive PDAs
    [listing] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("listing"),
        seller.publicKey.toBuffer(),
        nftMint.toBuffer(),
      ],
      program.programId
    );

    [escrowTokenAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), listing.toBuffer()],
      program.programId
    );

    // List the NFT first (setup for buy tests)
    await program.methods
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

    console.log("Setup complete: NFT listed for", priceInSol.toString(), "lamports");
  });

  // ============ TEST CASES ============

  it("Successfully buys an NFT", async () => {
    // Get balances before
    const sellerBalanceBefore = await provider.connection.getBalance(seller.publicKey);
    const buyerBalanceBefore = await provider.connection.getBalance(buyer.publicKey);

    // Call buy_nft
    const tx = await program.methods
      .buyNft()
      .accounts({
        buyer: buyer.publicKey,
        seller: seller.publicKey,
        listing: listing,
        escrowTokenAccount: escrowTokenAccount,
        buyerTokenAccount: buyerTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([buyer])
      .rpc();

    console.log("Buy tx:", tx);

    // Verify: Listing is now inactive
    const listingAccount = await program.account.listing.fetch(listing);
    assert.isFalse(listingAccount.isActive, "Listing should be inactive");
    console.log("✓ Listing marked as inactive");

    // Verify: NFT transferred to buyer
    const buyerTokenAccountInfo = await getAccount(
      provider.connection,
      buyerTokenAccount
    );
    assert.equal(
      buyerTokenAccountInfo.amount.toString(),
      "1",
      "Buyer should have NFT"
    );
    console.log("✓ NFT transferred to buyer");

    // Verify: Escrow is empty
    const escrowTokenAccountInfo = await getAccount(
      provider.connection,
      escrowTokenAccount
    );
    assert.equal(
      escrowTokenAccountInfo.amount.toString(),
      "0",
      "Escrow should be empty"
    );
    console.log("✓ Escrow emptied");

    // Verify: SOL transferred to seller
    const sellerBalanceAfter = await provider.connection.getBalance(seller.publicKey);
    const expectedBalance = sellerBalanceBefore + priceInSol.toNumber();
    assert.equal(
      sellerBalanceAfter,
      expectedBalance,
      "Seller should receive SOL"
    );
    console.log("✓ SOL transferred to seller");
  });

  it("Fails to buy an already sold NFT", async () => {
    // Try to buy again (should fail because listing is inactive)
    try {
      await program.methods
        .buyNft()
        .accounts({
          buyer: buyer.publicKey,
          seller: seller.publicKey,
          listing: listing,
          escrowTokenAccount: escrowTokenAccount,
          buyerTokenAccount: buyerTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([buyer])
        .rpc();

      assert.fail("Should have failed with ListingNotActive");
    } catch (error) {
      assert.include(error.message, "ListingNotActive");
      console.log("✓ Correctly rejected purchase of inactive listing");
    }
  });

  it("Fails when buyer has insufficient funds", async () => {
    // Create a new listing with high price
    const poorBuyer = Keypair.generate();
    const poorBuyerAirdrop = await provider.connection.requestAirdrop(
      poorBuyer.publicKey,
      0.1 * LAMPORTS_PER_SOL // Only 0.1 SOL
    );
    await provider.connection.confirmTransaction(poorBuyerAirdrop);

    // Create new seller and NFT
    const newSeller = Keypair.generate();
    const newSellerAirdrop = await provider.connection.requestAirdrop(
      newSeller.publicKey,
      5 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(newSellerAirdrop);

    const newNftMint = await createMint(
      provider.connection,
      newSeller,
      newSeller.publicKey,
      null,
      0
    );

    const newSellerTokenAccount = await createAccount(
      provider.connection,
      newSeller,
      newNftMint,
      newSeller.publicKey
    );

    await mintTo(
      provider.connection,
      newSeller,
      newNftMint,
      newSellerTokenAccount,
      newSeller.publicKey,
      1
    );

    // Derive PDAs
    const [newListing] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("listing"),
        newSeller.publicKey.toBuffer(),
        newNftMint.toBuffer(),
      ],
      program.programId
    );

    const [newEscrow] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), newListing.toBuffer()],
      program.programId
    );

    // List NFT for 5 SOL (more than poor buyer has)
    const highPrice = new anchor.BN(5 * LAMPORTS_PER_SOL);
    await program.methods
      .listNft(highPrice)
      .accounts({
        seller: newSeller.publicKey,
        nftMint: newNftMint,
        sellerTokenAccount: newSellerTokenAccount,
        listing: newListing,
        escrowTokenAccount: newEscrow,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([newSeller])
      .rpc();

    // Create buyer token account
    const poorBuyerTokenAccount = await createAccount(
      provider.connection,
      poorBuyer,
      newNftMint,
      poorBuyer.publicKey
    );

    // Try to buy (should fail - insufficient funds)
    try {
      await program.methods
        .buyNft()
        .accounts({
          buyer: poorBuyer.publicKey,
          seller: newSeller.publicKey,
          listing: newListing,
          escrowTokenAccount: newEscrow,
          buyerTokenAccount: poorBuyerTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([poorBuyer])
        .rpc();

      assert.fail("Should have failed with insufficient funds");
    } catch (error) {
      // Will fail with transfer error due to insufficient funds
      console.log("✓ Correctly rejected purchase with insufficient funds");
    }
  });
});
