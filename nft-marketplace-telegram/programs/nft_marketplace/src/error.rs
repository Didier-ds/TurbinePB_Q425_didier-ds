use anchor_lang::prelude::*;

#[error_code]
pub enum MarketplaceError {
    #[msg("Invalid NFT - must have amount = 1")]
    InvalidNFT,
    #[msg("Invalid owner")]
    InvalidOwner,
    #[msg("Listing is not active")]
    ListingNotActive,
    #[msg("Only the seller can cancel this listing")]
    UnauthorizedCancel
}