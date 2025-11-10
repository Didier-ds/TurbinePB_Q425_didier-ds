use anchor_lang::prelude::*;

declare_id!("EGnK6raXcxPNVLmGPaYERLjJbdV3Xnnw7CNTCEYpwQSm");

#[program]
pub mod hello_solana {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Hello, Solana!");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
