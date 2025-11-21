use crate::{Listing, MarketplaceError};
use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

pub fn buy_nft(ctx: Context<BuyNFT>) -> Result<()> {
    // Step 1: Extract data from listing before mutable borrow
    let price = ctx.accounts.listing.price_sol;
    let bump = ctx.accounts.listing.bump;
    let seller = ctx.accounts.listing.seller;
    let nft_mint = ctx.accounts.listing.nft_mint;

    // Step 2: Transfer SOL from buyer to seller
    let sol_transfer = system_program::Transfer {
        from: ctx.accounts.buyer.to_account_info(),
        to: ctx.accounts.seller.to_account_info(),
    };

    let sol_cpi_ctx = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        sol_transfer,
    );

    system_program::transfer(sol_cpi_ctx, price)?;

    // Step 3: Transfer NFT from escrow to buyer (PDA signs)
    let listing_seeds = &[
        Listing::SEED_PREFIX,
        seller.as_ref(),
        nft_mint.as_ref(),
        &[bump],
    ];
    let signer_seeds = &[&listing_seeds[..]];

    let nft_transfer = Transfer {
        from: ctx.accounts.escrow_token_account.to_account_info(),
        to: ctx.accounts.buyer_token_account.to_account_info(),
        authority: ctx.accounts.listing.to_account_info(),
    };

    let nft_cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        nft_transfer,
        signer_seeds,
    );

    token::transfer(nft_cpi_ctx, 1)?;

    // Step 4: Mark listing as inactive
    let listing = &mut ctx.accounts.listing;
    listing.is_active = false;

    msg!("NFT purchased for {} lamports", price);
    Ok(())
}

#[derive(Accounts)]
pub struct BuyNFT<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    /// CHECK: Verified via listing.seller constraint
    #[account(
        mut,
        constraint = seller.key() == listing.seller @ MarketplaceError::InvalidOwner
    )]
    pub seller: AccountInfo<'info>,

    // The listing PDA - stores price, controls escrow
    #[account(
        mut,
        seeds = [Listing::SEED_PREFIX, listing.seller.as_ref(), listing.nft_mint.as_ref()],
         bump = listing.bump,
         constraint = listing.is_active @ MarketplaceError::ListingNotActive,
    )]
    pub listing: Account<'info, Listing>,

    #[account(
      mut,
      seeds = [b"escrow", listing.key().as_ref()],
      bump = listing.escrow_bump,
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    #[account(
      mut,
      constraint = buyer_token_account.mint == listing.nft_mint,
      constraint = buyer_token_account.owner == buyer.key(),
    )]
    pub buyer_token_account: Account<'info, TokenAccount>,


    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,

}