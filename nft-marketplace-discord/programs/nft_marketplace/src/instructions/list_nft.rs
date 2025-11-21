use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::Listing;
use crate::error::MarketplaceError;  // Use shared error

pub fn list_nft(ctx: Context<ListNFT>, price_sol: u64) -> Result<()> {
    let listing_key = ctx.accounts.listing.key();
    let listing = &mut ctx.accounts.listing;
    let clock = Clock::get()?;

    // Verify NFT ownership - NFTs have amount = 1
    require!(
        ctx.accounts.seller_token_account.amount == 1,
        MarketplaceError::InvalidNFT
    );
    require!(
        ctx.accounts.seller_token_account.owner == ctx.accounts.seller.key(),
        MarketplaceError::InvalidOwner
    );

    // Initialize listing account
    listing.listing_id = listing_key;
    listing.seller = ctx.accounts.seller.key();
    listing.nft_mint = ctx.accounts.nft_mint.key();
    listing.nft_token_account = ctx.accounts.escrow_token_account.key();
    listing.price_sol = price_sol;
    listing.created_at = clock.unix_timestamp;
    listing.is_active = true;
    listing.bump = ctx.bumps.listing;
    listing.escrow_bump = ctx.bumps.escrow_token_account;

    // Transfer NFT from seller to escrow
    let cpi_accounts = Transfer {
        from: ctx.accounts.seller_token_account.to_account_info(),
        to: ctx.accounts.escrow_token_account.to_account_info(),
        authority: ctx.accounts.seller.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::transfer(cpi_ctx, 1)?;

    msg!("NFT listed for {} lamports", price_sol);
    Ok(())
}

#[derive(Accounts)]
pub struct ListNFT<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,

    /// CHECK: We verify this is an NFT by checking the token account
    pub nft_mint: UncheckedAccount<'info>,

    #[account(
        mut,
        constraint = seller_token_account.mint == nft_mint.key(),
        constraint = seller_token_account.owner == seller.key()
    )]
    pub seller_token_account: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = seller,
        space = 8 + Listing::space(),
        seeds = [Listing::SEED_PREFIX, seller.key().as_ref(), nft_mint.key().as_ref()],
        bump
    )]
    pub listing: Account<'info, Listing>,

    #[account(
        init,
        payer = seller,
        seeds = [b"escrow", listing.key().as_ref()],
        bump,
        token::mint = nft_mint,
        token::authority = listing,
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
