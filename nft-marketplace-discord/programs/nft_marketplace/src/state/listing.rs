use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Listing {
    pub listing_id: Pubkey,
    pub seller: Pubkey,
    pub nft_mint: Pubkey,              // NFT mint address
    pub nft_token_account: Pubkey,    // Escrow token account address
    pub price_sol: u64,                // Price in lamports
    pub created_at: i64,               // Unix timestamp
    pub is_active: bool,               // Whether listing is active
    pub bump: u8,                      // Listing PDA bump
    pub escrow_bump: u8,    
}

impl Listing {
    pub const SEED_PREFIX: &[u8] = b"listing";

    pub fn space() -> usize {
        8 + // discriminator
        32 + // listing_id
        32 + // seller
        32 + // nft_mint
        32 + // nft_token_account
        8 +  // price_sol
        8 +  // created_at
        1 +  // is_active
        1 +  // bump
        1   // escrow_bump
    }
}