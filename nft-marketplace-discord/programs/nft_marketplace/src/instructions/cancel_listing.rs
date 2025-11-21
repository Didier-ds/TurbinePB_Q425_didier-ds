use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::error::MarketplaceError;
use crate::Listing;

pub fn cancel_listing(ctx: Context<CancelListing>) -> Result<()> {
    let bump = ctx.accounts.listing.bump;
    let seller = ctx.accounts.listing.seller;
    let nft_mint = ctx.accounts.listing.nft_mint;
    let listing = &mut ctx.accounts.listing;

    // VALIDATION 1: Check listing is active
    require!(
          listing.is_active,
          MarketplaceError::ListingNotActive
      );

    // VALIDATION 2: Check seller authorization
    // (This is actually automatic because of the constraint in #[account])

    // The listing PDA must sign because it owns the escrow
    let listing_seeds = &[
        Listing::SEED_PREFIX,
        seller.as_ref(),           // seller pubkey
        nft_mint.as_ref(),         // nft mint pubkey
        &[bump],                   // bump seed
    ];
    let signer_seeds = &[&listing_seeds[..]];

    // TRANSFER: escrow → seller (PDA signs!)
    let transfer_accounts = Transfer {
        from: ctx.accounts.escrow_token_account.to_account_info(),
        to: ctx.accounts.seller_token_account.to_account_info(),
        authority: listing.to_account_info(), // PDA is authority!
    };

    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        transfer_accounts,
        signer_seeds,  // ← THIS is the magic! PDA signs here
    );

    token::transfer(cpi_ctx, 1)?;  // Transfer 1 NFT

    // UPDATE STATE: Mark listing as inactive
    listing.is_active = false;

    msg!("Listing cancelled. NFT returned to seller.");
    Ok(())
}

#[derive(Accounts)]
pub struct  CancelListing<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,

    #[account(
        mut,
        seeds = [Listing::SEED_PREFIX, seller.key().as_ref(), listing.nft_mint.as_ref()],
        bump = listing.bump,
        constraint = listing.seller == seller.key() @ MarketplaceError::UnauthorizedCancel,
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
          constraint = seller_token_account.mint == listing.nft_mint,
          constraint = seller_token_account.owner == seller.key(),
    )]
    pub seller_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}