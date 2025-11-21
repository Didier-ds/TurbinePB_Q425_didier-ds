use anchor_lang::prelude::*;

pub mod state;
pub mod instructions;
pub mod error;

pub use state::*;
pub use instructions::*;
pub use error::*;

declare_id!("67AAvxuwtST6foKb3141DAy4eUGnUFVZYERKEBytu5sc");

#[program]
pub mod nft_marketplace {
    use super::*;

    pub fn list_nft(ctx: Context<ListNFT>, price_in_sol: u64) -> Result<()> {
        instructions::list_nft::list_nft(ctx, price_in_sol)
    }

    pub fn cancel_listing(ctx: Context<CancelListing>) -> Result<()> {
        instructions::cancel_listing::cancel_listing(ctx)
    }

    pub fn buy_nft(ctx: Context<BuyNFT>) -> Result<()> {
        instructions::buy_nft::buy_nft(ctx)
    }
}