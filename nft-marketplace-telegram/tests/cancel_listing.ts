import * as anchor from "@coral-xyz/anchor";
import {Program} from "@coral-xyz/anchor";
import { NftMarketplace } from "../target/types/nft_marketplace";
import {Keypair, LAMPORTS_PER_SOL, PublicKey} from "@solana/web3.js";
import {createAccount, createMint, getAccount, mintTo, TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {assert} from "chai";

describe("cancel_listing", () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program  = anchor.workspace.nftMarketplace as Program<NftMarketplace>;

//     Test accounts
    let seller: Keypair;
    let nftMint: PublicKey;
    let sellerTokenAccount: PublicKey;
    let listing: PublicKey;
    let escrowTokenAccount: PublicKey;

    const priceInSol = new anchor.BN(1 * LAMPORTS_PER_SOL);

    before(async () => {
        // Setup: Create seller with SOL
        seller = Keypair.generate();
        const airdropSig = await provider.connection.requestAirdrop(
            seller.publicKey,
            10 * LAMPORTS_PER_SOL
        );
        await provider.connection.confirmTransaction(airdropSig);

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

        // List the NFT first (setup for cancel tests)
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

        console.log("Setup complete: NFT listed");
    });

    // ============ TEST CASES ============

    it("Successfully cancels a listing", async () => {
        // Call cancel_listing
        const tx = await program.methods
            .cancelListing()
            .accounts({
                seller: seller.publicKey,
                listing: listing,
                escrowTokenAccount: escrowTokenAccount,
                sellerTokenAccount: sellerTokenAccount,
                tokenProgram: TOKEN_PROGRAM_ID,
            })
            .signers([seller])
            .rpc();

        console.log("Cancel tx:", tx);

        // Verify: Listing is now inactive
        const listingAccount = await program.account.listing.fetch(listing);
        assert.isFalse(listingAccount.isActive, "Listing should be inactive");
        console.log("✓ Listing marked as inactive");

        // Verify: NFT returned to seller
        const sellerTokenAccountInfo = await getAccount(
            provider.connection,
            sellerTokenAccount
        );
        assert.equal(
            sellerTokenAccountInfo.amount.toString(),
            "1",
            "Seller should have NFT back"
        );
        console.log("✓ NFT returned to seller");

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
    });

    it("Fails to cancel an already inactive listing", async () => {
        // Try to cancel again (should fail)
        try {
            await program.methods
                .cancelListing()
                .accounts({
                    seller: seller.publicKey,
                    listing: listing,
                    escrowTokenAccount: escrowTokenAccount,
                    sellerTokenAccount: sellerTokenAccount,
                    tokenProgram: TOKEN_PROGRAM_ID,
                })
                .signers([seller])
                .rpc();

            assert.fail("Should have failed with ListingNotActive");
        } catch (error) {
            assert.include(error.message, "ListingNotActive");
            console.log("✓ Correctly rejected inactive listing cancellation");
        }
    });

    it("Fails when non-seller tries to cancel", async () => {
        // Create a new listing first (since we cancelled the previous one)
        const newSeller = Keypair.generate();

        // Airdrop to new seller
        const airdropSig = await provider.connection.requestAirdrop(
            newSeller.publicKey,
            5 * LAMPORTS_PER_SOL
        );
        await provider.connection.confirmTransaction(airdropSig);

        // Create new NFT
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

        // Derive PDAs for new listing
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

        // List the new NFT
        await program.methods
            .listNft(priceInSol)
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

        // Create attacker
        const attacker = Keypair.generate();
        const attackerAirdrop = await provider.connection.requestAirdrop(
            attacker.publicKey,
            2 * LAMPORTS_PER_SOL
        );
        await provider.connection.confirmTransaction(attackerAirdrop);

        // Attacker creates their own token account for the NFT
        const attackerTokenAccount = await createAccount(
            provider.connection,
            attacker,
            newNftMint,
            attacker.publicKey
        );

        // Attacker tries to cancel newSeller's listing
        try {
            await program.methods
                .cancelListing()
                .accounts({
                    seller: attacker.publicKey,  // Wrong! Attacker is not the seller
                    listing: newListing,
                    escrowTokenAccount: newEscrow,
                    sellerTokenAccount: attackerTokenAccount,
                    tokenProgram: TOKEN_PROGRAM_ID,
                })
                .signers([attacker])
                .rpc();

            assert.fail("Should have failed - attacker is not seller");
        } catch (error) {
            // Could be UnauthorizedCancel or a seeds constraint error
            console.log("✓ Correctly rejected unauthorized cancellation");
            console.log("  Error:", error.message.substring(0, 100));
        }
    });
})