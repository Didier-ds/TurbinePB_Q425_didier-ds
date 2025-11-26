# Quick Test Guide - /list and /buy (30 min)

## Prerequisites
- Bot is running (`npm run dev`)
- You have a Discord wallet (`/wallet` command)

## Step 1: Create Test NFT (2 min)

```bash
cd nft-marketplace-discord/bot

# Get your wallet address from Discord: /wallet
# Then create NFT:
ts-node src/scripts/create-simple-nft.ts <YOUR_WALLET_ADDRESS>
```

**Copy the mint address from output!**

## Step 2: Test /list (5 min)

In Discord:
```
/list mint:<MINT_ADDRESS> price:0.1
```

**Expected:**
- ✅ "NFT Listed!" message
- ✅ Transaction link to Solscan
- ✅ NFT moved to escrow

**If it fails:**
- Check error message
- Make sure you own the NFT
- Make sure you have SOL for fees (~0.001 SOL)

## Step 3: Test /browse (2 min)

In Discord:
```
/browse
```

**Expected:**
- ✅ Your listing appears
- ✅ Shows price, seller, mint address
- ✅ "Buy" button visible

## Step 4: Test /buy (5 min)

**Option A: Same wallet (for quick test)**
- You can't buy your own listing (seller = buyer)
- Create a second wallet or use a friend's wallet

**Option B: Two wallets (proper test)**
1. Create second wallet in Discord: `/wallet` (different user or DM yourself)
2. Airdrop SOL to second wallet if needed
3. Use second wallet to click "Buy" button on your listing

**Expected:**
- ✅ "Purchase Successful!" message
- ✅ NFT transferred to buyer
- ✅ SOL transferred to seller
- ✅ Listing marked inactive

## Quick Test Checklist

- [ ] NFT created with `freezeAuthority: null`
- [ ] `/list` command works
- [ ] `/browse` shows listing
- [ ] `/buy` button works (need 2 wallets)
- [ ] NFT transferred to buyer
- [ ] SOL transferred to seller

## Troubleshooting

**"Account is frozen" error:**
- NFT was created with freeze authority
- Use `create-simple-nft.ts` instead

**"Insufficient funds" error:**
- Need SOL for transaction fees
- Airdrop: `solana airdrop 1 <WALLET> --url devnet`

**"You need a wallet first" error:**
- Run `/wallet` command first

**Buy button doesn't work:**
- Check bot logs for errors
- Make sure buyer has enough SOL (price + fees)
- Make sure listing is still active

