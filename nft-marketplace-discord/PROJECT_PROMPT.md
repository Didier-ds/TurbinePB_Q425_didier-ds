# NFT Trading Marketplace - Discord Bot
## Project Prompt Document (Updated for Discord)

---

## PROJECT OVERVIEW

Build a **Discord-based NFT Trading Marketplace** that allows users to:
1. **List NFTs for SOL** (fixed price sales)
2. **Swap NFTs peer-to-peer** (NFT for NFT trades)

All transactions happen on **Solana blockchain** with smart contract escrow for security.

**Timeline:** 3 days (Tuesday - Thursday)
**Deployment:** Devnet initially, mainnet ready
**Platform:** Discord Bot (discord.js v14)

---

## PROJECT STRUCTURE

```
nft-marketplace-discord/
├── programs/
│   ├── nft_marketplace/          (NFT for SOL listing & buying)
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   ├── instructions/
│   │   │   │   ├── list_nft.rs
│   │   │   │   ├── buy_nft.rs
│   │   │   │   ├── cancel_listing.rs
│   │   │   │   └── withdraw.rs
│   │   │   └── state/
│   │   │       ├── listing.rs
│   │   │       └── marketplace.rs
│   │   └── Cargo.toml
│   │
│   └── nft_swap/                (NFT for NFT swapping)
│       ├── src/
│       │   ├── lib.rs
│       │   ├── instructions/
│       │   │   ├── create_offer.rs
│       │   │   ├── accept_offer.rs
│       │   │   ├── execute_swap.rs
│       │   │   └── cancel_offer.rs
│       │   └── state/
│       │       ├── swap_offer.rs
│       │       └── escrow.rs
│       └── Cargo.toml
│
├── bot/
│   ├── src/
│   │   ├── index.ts              (Main bot entry point)
│   │   │
│   │   ├── commands/             (Slash commands)
│   │   │   ├── list.ts           (/list <nft_mint> <price>)
│   │   │   ├── browse.ts         (/browse [page])
│   │   │   ├── my-listings.ts    (/my-listings)
│   │   │   ├── buy.ts            (/buy <listing_id>)
│   │   │   ├── offer.ts          (/offer <my_nft> <wanted_nft>)
│   │   │   ├── accept.ts         (/accept <offer_id>)
│   │   │   ├── my-offers.ts      (/my-offers)
│   │   │   ├── offers-for-me.ts  (/offers-for-me)
│   │   │   ├── portfolio.ts      (/portfolio)
│   │   │   ├── wallet.ts         (/wallet)
│   │   │   ├── withdraw.ts       (/withdraw)
│   │   │   └── help.ts           (/help)
│   │   │
│   │   ├── events/               (Discord event handlers)
│   │   │   ├── ready.ts          (Bot startup)
│   │   │   ├── interactionCreate.ts  (All interactions)
│   │   │   └── error.ts          (Error handling)
│   │   │
│   │   ├── embeds/               (Rich embed messages)
│   │   │   ├── listingEmbed.ts   (Display listing card)
│   │   │   ├── swapEmbed.ts      (Display swap offer)
│   │   │   ├── portfolioEmbed.ts (Display NFTs)
│   │   │   ├── confirmEmbed.ts   (Confirmation dialogs)
│   │   │   └── errorEmbed.ts     (Error messages)
│   │   │
│   │   ├── components/           (Buttons, select menus)
│   │   │   ├── listingButtons.ts ([Buy] [Cancel] [Details])
│   │   │   ├── swapButtons.ts    ([Accept] [Reject] [Execute])
│   │   │   └── selectMenus.ts    (NFT selection dropdowns)
│   │   │
│   │   ├── services/
│   │   │   ├── solana.service.ts (Blockchain interactions)
│   │   │   ├── wallet.service.ts (Wallet management)
│   │   │   ├── nft.service.ts    (NFT queries)
│   │   │   ├── db.service.ts     (Database operations)
│   │   │   └── discord.service.ts (Discord utilities)
│   │   │
│   │   └── handlers/
│   │       ├── button.handler.ts   (Button click handling)
│   │       ├── modal.handler.ts    (Modal submissions)
│   │       └── error.handler.ts    (Error responses)
│   │
│   ├── .env
│   └── package.json
│
├── database/
│   ├── models/
│   │   ├── User.ts           (Discord user + wallet)
│   │   ├── Listing.ts        (NFT listings for sale)
│   │   ├── SwapOffer.ts      (Pending swap offers)
│   │   └── Transaction.ts    (Trade history)
│   └── db.ts                 (MongoDB connection)
│
├── PROJECT_PROMPT.md
├── ARCHITECTURE.md
├── USER_STORIES.md
├── Anchor.toml
├── README.md
└── .env.example
```

---

## SMART CONTRACTS

### Program 1: NFT Marketplace (NFT for SOL)

**Functions:**
```rust
1. list_nft(nft_mint, price_in_sol) → Create listing
2. buy_nft(listing_id) → Purchase NFT for SOL
3. cancel_listing(listing_id) → Remove listing
4. withdraw_earnings() → Seller withdraws SOL
```

**State:**
```rust
Listing {
  listing_id: Pubkey,
  seller: Pubkey,
  nft_mint: Pubkey,
  price_sol: u64,
  created_at: i64,
  is_active: bool,
}
```

**Events:**
- `ListingCreated`
- `NFTPurchased`
- `ListingCancelled`
- `EarningsWithdrawn`

---

### Program 2: NFT Swap (NFT for NFT)

**Functions:**
```rust
1. create_swap_offer(my_nft, wanted_nft) → Propose swap
2. accept_swap_offer(offer_id) → Accept proposal
3. execute_swap(offer_id) → Execute atomic swap
4. cancel_offer(offer_id) → Cancel proposal
```

**State:**
```rust
SwapOffer {
  offer_id: Pubkey,
  offerer: Pubkey,
  offerer_nft: Pubkey,
  recipient: Pubkey,
  recipient_nft: Pubkey,
  status: OfferStatus, // Pending, Accepted, Completed
  created_at: i64,
}
```

**Events:**
- `SwapOfferCreated`
- `SwapOfferAccepted`
- `SwapExecuted`
- `SwapCancelled`

---

## DISCORD BOT SLASH COMMANDS

### Wallet Management
```
/wallet              → Show wallet address & SOL balance
/portfolio           → Show user's NFTs with images
/help                → Show all commands
```

### NFT for SOL (Listing & Buying)
```
/list <nft_mint> <price>        → List NFT for SOL
/browse [page]                  → Browse all listings (paginated)
/my-listings                    → Show your active listings
/buy <listing_id>               → Buy listed NFT
/withdraw                       → Withdraw SOL earnings
```

### NFT for NFT (Swapping)
```
/offer <my_nft> <wanted_nft>   → Create swap offer
/my-offers                      → Show your sent offers
/offers-for-me                  → Show offers on your NFTs
/accept <offer_id>              → Accept swap offer
```

### Discord-Specific Features
```
Buttons:
[Buy Now] [Cancel] [Accept] [Reject] [Execute Swap] [View Details]

Select Menus:
- Choose NFT from your wallet (for listing/offering)

Embeds:
- Rich listing cards with images
- Swap offer previews
- Portfolio display
- Transaction confirmations
```

---

## DISCORD CHANNELS STRUCTURE

Your Discord server should have:

```
📌 MARKETPLACE
├── #marketplace          - Browse all active listings
├── #swaps               - Active swap offers
└── #completed           - Finished trades (history)

📊 USER CHANNELS
├── #my-listings         - Your active listings (DM notification)
├── #my-offers           - Your pending offers (DM notification)
└── #offers-for-me       - Offers on your NFTs (DM notification)

ℹ️ INFO
├── #rules              - Marketplace rules
├── #faq                - Frequently asked questions
└── #announcements      - Important updates
```

---

## DATABASE SCHEMA

### Users Collection
```javascript
{
  _id: ObjectId,
  discord_id: String,           // Unique Discord user ID
  discord_username: String,
  wallet: String,               // Solana pubkey
  private_key: String,          // Encrypted
  sol_balance: Number,          // Cached
  nft_count: Number,
  completed_trades: Number,
  created_at: Date,
  last_active: Date,
  dm_notifications: Boolean,    // Prefer DMs?
}
```

### Listings Collection
```javascript
{
  _id: ObjectId,
  listing_id: String,           // Unique ID
  seller_discord_id: String,
  seller_wallet: String,
  seller_username: String,
  nft_mint: String,
  nft_name: String,
  nft_image: String,            // IPFS URL
  nft_collection: String,
  price_sol: Number,
  status: "active" | "sold" | "cancelled",
  created_at: Date,
  sold_at: Date | null,
  buyer_discord_id: String | null,
  buyer_wallet: String | null,
  tx_hash: String | null,
  message_id: String,           // Discord message ID for editing
}
```

### Swap Offers Collection
```javascript
{
  _id: ObjectId,
  offer_id: String,
  offerer_discord_id: String,
  offerer_wallet: String,
  offerer_username: String,
  offerer_nft: String,
  offerer_nft_name: String,
  offerer_nft_image: String,
  
  recipient_discord_id: String,
  recipient_wallet: String,
  recipient_username: String,
  recipient_nft: String,
  recipient_nft_name: String,
  recipient_nft_image: String,
  
  status: "pending" | "accepted" | "completed" | "cancelled",
  created_at: Date,
  accepted_at: Date | null,
  completed_at: Date | null,
  tx_hash: String | null,
  message_id: String,           // Discord message ID
}
```

### Transactions Collection (History)
```javascript
{
  _id: ObjectId,
  tx_hash: String,
  type: "sale" | "swap",
  seller_discord_id: String,
  buyer_discord_id: String,
  nft_mint: String,
  amount_sol: Number | null,     // For sales
  created_at: Date,
  status: "pending" | "completed" | "failed",
}
```

---

## TRANSACTION FLOWS

### Flow 1: List NFT for SOL

```
User in Discord
  ↓
Types /list <nft_mint> <5_sol>
  ↓
Discord modal opens (confirm listing)
  ↓
User submits
  ↓
Bot verifies user owns NFT
  ↓
Bot calls smart contract: list_nft(nft_mint, 5_sol)
  ↓
Smart contract locks NFT in escrow
  ↓
Bot stores listing in database
  ↓
Bot creates embed card in #marketplace
  ↓
Bot sends DM: "✅ Your NFT is listed!"
```

### Flow 2: Browse & Buy NFT

```
User in Discord #marketplace
  ↓
Sees listing embed with [Buy Now] button
  ↓
Clicks [Buy Now]
  ↓
Bot shows confirmation embed
  ↓
User clicks [Confirm Purchase]
  ↓
Bot verifies user has SOL
  ↓
Bot calls smart contract: buy_nft(listing_id)
  ↓
Smart contract:
  - NFT → Buyer
  - 5 SOL → Seller
  ↓
Bot updates database (status: "sold")
  ↓
Bot edits original embed: "SOLD ✅"
  ↓
Notify both users via DM:
  - Seller: "Your NFT sold for 5 SOL!"
  - Buyer: "Purchase complete! NFT transferred."
```

### Flow 3: Create Swap Offer

```
User in Discord
  ↓
Types /offer <my_nft> <wanted_nft>
  ↓
Bot shows select menu (choose your NFT)
  ↓
User selects their NFT
  ↓
Bot finds who owns wanted NFT (or searches blockchain)
  ↓
Bot calls smart contract: create_swap_offer(...)
  ↓
Smart contract locks user's NFT in escrow
  ↓
Bot stores offer in database
  ↓
Bot posts embed in #swaps
  ↓
Bot DMs recipient: "New swap offer for your NFT!"
  ↓
Recipient's /offers-for-me shows pending offer
```

### Flow 4: Accept Swap Offer

```
Recipient in Discord
  ↓
Types /accept <offer_id>
  ↓
Bot shows confirmation embed:
  "You'll give: [NFT] | You'll get: [NFT]"
  ↓
Recipient clicks [Accept]
  ↓
Bot calls smart contract: accept_swap_offer(...)
  ↓
Smart contract locks recipient's NFT in escrow
  ↓
Database status: "accepted"
  ↓
Both users notified:
  "Swap ready! Click [Execute] to finalize"
```

### Flow 5: Execute Swap

```
Either user
  ↓
Clicks [Execute Swap] button
  ↓
Bot calls smart contract: execute_swap(...)
  ↓
Smart contract:
  - NFT A → User B
  - NFT B → User A
  - Escrows cleared
  ↓
Bot updates database (status: "completed")
  ↓
Bot edits #swaps embed: "COMPLETED ✅"
  ↓
Both users DM'd:
  "✅ Swap complete! NFTs transferred."
```

---

## DISCORD-SPECIFIC FEATURES

### Rich Embeds
Each listing/offer shows as a beautiful card:

```
╔════════════════════════════════════╗
║ 🖼️ Pixel Art #001                  ║
║                                    ║
║ [NFT Image - 300x300px]           ║
║                                    ║
║ Price: 5 SOL                       ║
║ Seller: @User123                   ║
║ Collection: PixelArt Collection    ║
║ Floor: 3.5 SOL                     ║
║                                    ║
║ [Buy Now] [View Details]           ║
╚════════════════════════════════════╝
```

### Interactive Buttons
```
[Buy Now]      - Click to purchase
[Accept]       - Accept swap offer
[Reject]       - Reject offer
[Execute]      - Execute swap
[Cancel]       - Cancel listing/offer
[View Details] - See full NFT info
```

### Select Menus
When listing or offering, user selects NFT from dropdown:
```
Select NFT to list:
├── Pixel Art #001 (Floor: 3.5 SOL)
├── Galaxy #042 (Floor: 5.2 SOL)
├── Cool Cat #156 (Floor: 8.5 SOL)
└── ...
```

### Auto-Updated Messages
Bot edits original embed when status changes:
- "ACTIVE" → "SOLD ✅" (when purchased)
- "PENDING" → "ACCEPTED ⏳" → "COMPLETED ✅" (for swaps)

### DM Notifications
Users get private DMs for:
- Your listing sold
- New swap offer for your NFT
- Swap offer accepted
- Swap completed

---

## KEY TECHNICAL DETAILS

### Wallet Management
- Store encrypted private keys in database
- Never expose private key in logs
- Use Anchor/Solana SDK to sign transactions
- Validate wallet ownership via signature

### NFT Detection
- Query Solana RPC for user's token accounts
- Filter for NFTs (decimals = 0)
- Fetch metadata from Metaplex
- Cache in database (update on each action)

### Discord Integration
- Use discord.js v14
- Slash commands (modern approach)
- Button interactions (immediate feedback)
- Embeds (rich formatting)
- DM notifications (private alerts)
- Ephemeral responses (hide from public)

### Error Handling
- User doesn't own NFT → Error embed
- Insufficient SOL → Error embed
- Transaction fails → Refund & notify
- Wallet not connected → Guide to setup
- Permission errors → Clear message

### Security
- Validate all inputs (mint addresses, amounts)
- Check ownership before listing/swapping
- Use smart contract escrow (trustless)
- Encrypt private keys at rest
- Rate limit commands (prevent spam)
- Never show private keys in logs

---

## TECH STACK

| Layer | Technology |
|-------|------------|
| **Blockchain** | Solana (devnet/mainnet) |
| **Smart Contracts** | Anchor (Rust) |
| **Bot Framework** | discord.js v14 |
| **Language** | TypeScript |
| **Database** | MongoDB |
| **Wallet Integration** | @solana/web3.js |
| **RPC** | Helius or QuickNode (free tier) |
| **Deployment** | Railway or Replit (free) |
| **NFT Metadata** | Metaplex/IPFS |

---

## DEPLOYMENT CHECKLIST

### Smart Contracts
- [ ] Write both programs
- [ ] Test locally (`anchor test`)
- [ ] Deploy to devnet (`anchor deploy --provider.cluster devnet`)
- [ ] Record program IDs
- [ ] Update bot config with program IDs

### Discord Bot
- [ ] Create Discord application at https://discord.com/developers/applications
- [ ] Get bot token
- [ ] Setup MongoDB database (MongoDB Atlas free tier)
- [ ] Create .env file with all credentials
- [ ] Register slash commands locally (`npm run register-commands`)
- [ ] Test all commands locally (`npm run dev`)
- [ ] Deploy to server (Railway or Replit)
- [ ] Invite bot to test server
- [ ] Test end-to-end flows

### Final Testing
- [ ] Test NFT for SOL flow (list, browse, buy)
- [ ] Test NFT for NFT flow (offer, accept, execute)
- [ ] Test error cases (no NFT, no SOL, etc.)
- [ ] Test Discord features (buttons, embeds, DMs)
- [ ] Performance testing (response time)
- [ ] Demo ready

---

## ACCEPTANCE CRITERIA

### Must Have (MVP)
- [x] Connect wallet to bot (via DM)
- [x] List NFT for SOL (with /list command)
- [x] Browse listings (in #marketplace with embeds)
- [x] Buy NFT (with button click)
- [x] Create NFT swap offer (with /offer)
- [x] Accept swap offer (with /accept)
- [x] Execute swap (atomic, trustless)
- [x] Show portfolio (with /portfolio)
- [x] View wallet balance (with /wallet)
- [x] All on devnet
- [x] Fully functional, no bugs

### Nice to Have
- [ ] NFT floor price comparison
- [ ] Listing expiration (auto-cancel after X days)
- [ ] Transaction history in database
- [ ] User reputation/trust score
- [ ] Mainnet support
- [ ] Listing images cached & displayed
- [ ] Search function (/search <term>)
- [ ] Filter by collection (/browse collection:<name>)
- [ ] Leaderboard (/leaderboard)

---

## CURRENT STATUS

**Started:** Tuesday (Today)
**Deadline:** Friday (End of day)
**Progress:** 0% (starting now)
**Platform:** Discord (not Telegram)

---

## NEXT STEPS

1. **Day 1:** Build smart contracts + deploy to devnet
2. **Day 2:** Build bot commands for NFT for SOL (list, browse, buy)
3. **Day 3:** Build bot commands for NFT for NFT (offer, accept, execute) + testing
4. **Friday:** Final polish, demo ready, present to bootcamp

---

## DISCORD SETUP

### Before Coding
1. Create Discord server for testing
2. Create channels (#marketplace, #swaps, #completed, etc.)
3. Go to https://discord.com/developers/applications
4. Create new application
5. Go to "Bot" tab, create bot
6. Copy bot token → Save in .env
7. Set permissions: `Send Messages, Embed Links, Manage Messages, Read Messages`
8. Invite bot to your test server

### After Coding
1. Run command registration script
2. Test all slash commands
3. Deploy to production server

---

## ENVIRONMENT VARIABLES

```
# Discord
DISCORD_TOKEN=<bot_token_from_developer_portal>
DISCORD_CLIENT_ID=<application_id>
DISCORD_GUILD_ID=<test_server_id>

# Solana
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_CLUSTER=devnet

# Programs
NFT_MARKETPLACE_PROGRAM_ID=<deploy_and_add>
NFT_SWAP_PROGRAM_ID=<deploy_and_add>

# Database
MONGODB_URI=<connection_string>
DB_NAME=nft_marketplace

# Security
ENCRYPTION_KEY=<random_32_char_key>

# Deployment
NODE_ENV=production
PORT=3000
```

---

## IMPORTANT NOTES FOR AI ASSISTANTS

If you're an AI helping with this project:

1. **Always refer to this prompt** when building
2. **Follow the project structure** exactly
3. **Use discord.js v14** (not v13)
4. **Create rich embeds** for all listings/offers
5. **Use buttons** for user interactions
6. **Send DMs** for private notifications
7. **Handle errors gracefully** (no crashes)
8. **Test thoroughly** before deployment
9. **Keep code clean** and well-commented
10. **Security first:** Never expose private keys, validate all inputs
11. **User experience:** Make interactions smooth and intuitive
12. **Report progress** regularly to developer

---

## ADVANTAGES OF DISCORD OVER TELEGRAM

✅ **Rich UI:** Embeds, colors, images, formatting
✅ **Buttons:** Interactive without text commands
✅ **Channels:** Organize listings, swaps, completed trades
✅ **Better Notifications:** DMs + channel updates
✅ **More Scalable:** Discord API is powerful
✅ **Community Feel:** Users see activity, builds trust
✅ **Professional:** Looks polished and impressive
✅ **Skill Showcase:** Shows discord.js expertise

---

## SUPPORT CONTACTS

**Developer:** [Your name/handle]
**Project Start:** Tuesday
**Project End:** Friday EOD
**Timezone:** [Your timezone]
**Platform:** Discord Bot (discord.js v14)

---

**This prompt is the complete specification for building the Discord NFT Marketplace Bot. Share it with any AI assistant or teammate to get them up to speed instantly!**
EOF
cat /home/claude/PROJECT_PROMPT_DISCORD.md
Output

# NFT Trading Marketplace - Discord Bot
## Project Prompt Document (Updated for Discord)

---

## PROJECT OVERVIEW

Build a **Discord-based NFT Trading Marketplace** that allows users to:
1. **List NFTs for SOL** (fixed price sales)
2. **Swap NFTs peer-to-peer** (NFT for NFT trades)

All transactions happen on **Solana blockchain** with smart contract escrow for security.

**Timeline:** 3 days (Tuesday - Thursday)
**Deployment:** Devnet initially, mainnet ready
**Platform:** Discord Bot (discord.js v14)

---

## PROJECT STRUCTURE

```
nft-marketplace-discord/
├── programs/
│   ├── nft_marketplace/          (NFT for SOL listing & buying)
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   ├── instructions/
│   │   │   │   ├── list_nft.rs
│   │   │   │   ├── buy_nft.rs
│   │   │   │   ├── cancel_listing.rs
│   │   │   │   └── withdraw.rs
│   │   │   └── state/
│   │   │       ├── listing.rs
│   │   │       └── marketplace.rs
│   │   └── Cargo.toml
│   │
│   └── nft_swap/                (NFT for NFT swapping)
│       ├── src/
│       │   ├── lib.rs
│       │   ├── instructions/
│       │   │   ├── create_offer.rs
│       │   │   ├── accept_offer.rs
│       │   │   ├── execute_swap.rs
│       │   │   └── cancel_offer.rs
│       │   └── state/
│       │       ├── swap_offer.rs
│       │       └── escrow.rs
│       └── Cargo.toml
│
├── bot/
│   ├── src/
│   │   ├── index.ts              (Main bot entry point)
│   │   │
│   │   ├── commands/             (Slash commands)
│   │   │   ├── list.ts           (/list <nft_mint> <price>)
│   │   │   ├── browse.ts         (/browse [page])
│   │   │   ├── my-listings.ts    (/my-listings)
│   │   │   ├── buy.ts            (/buy <listing_id>)
│   │   │   ├── offer.ts          (/offer <my_nft> <wanted_nft>)
│   │   │   ├── accept.ts         (/accept <offer_id>)
│   │   │   ├── my-offers.ts      (/my-offers)
│   │   │   ├── offers-for-me.ts  (/offers-for-me)
│   │   │   ├── portfolio.ts      (/portfolio)
│   │   │   ├── wallet.ts         (/wallet)
│   │   │   ├── withdraw.ts       (/withdraw)
│   │   │   └── help.ts           (/help)
│   │   │
│   │   ├── events/               (Discord event handlers)
│   │   │   ├── ready.ts          (Bot startup)
│   │   │   ├── interactionCreate.ts  (All interactions)
│   │   │   └── error.ts          (Error handling)
│   │   │
│   │   ├── embeds/               (Rich embed messages)
│   │   │   ├── listingEmbed.ts   (Display listing card)
│   │   │   ├── swapEmbed.ts      (Display swap offer)
│   │   │   ├── portfolioEmbed.ts (Display NFTs)
│   │   │   ├── confirmEmbed.ts   (Confirmation dialogs)
│   │   │   └── errorEmbed.ts     (Error messages)
│   │   │
│   │   ├── components/           (Buttons, select menus)
│   │   │   ├── listingButtons.ts ([Buy] [Cancel] [Details])
│   │   │   ├── swapButtons.ts    ([Accept] [Reject] [Execute])
│   │   │   └── selectMenus.ts    (NFT selection dropdowns)
│   │   │
│   │   ├── services/
│   │   │   ├── solana.service.ts (Blockchain interactions)
│   │   │   ├── wallet.service.ts (Wallet management)
│   │   │   ├── nft.service.ts    (NFT queries)
│   │   │   ├── db.service.ts     (Database operations)
│   │   │   └── discord.service.ts (Discord utilities)
│   │   │
│   │   └── handlers/
│   │       ├── button.handler.ts   (Button click handling)
│   │       ├── modal.handler.ts    (Modal submissions)
│   │       └── error.handler.ts    (Error responses)
│   │
│   ├── .env
│   └── package.json
│
├── database/
│   ├── models/
│   │   ├── User.ts           (Discord user + wallet)
│   │   ├── Listing.ts        (NFT listings for sale)
│   │   ├── SwapOffer.ts      (Pending swap offers)
│   │   └── Transaction.ts    (Trade history)
│   └── db.ts                 (MongoDB connection)
│
├── PROJECT_PROMPT.md
├── ARCHITECTURE.md
├── USER_STORIES.md
├── Anchor.toml
├── README.md
└── .env.example
```

---

## SMART CONTRACTS

### Program 1: NFT Marketplace (NFT for SOL)

**Functions:**
```rust
1. list_nft(nft_mint, price_in_sol) → Create listing
2. buy_nft(listing_id) → Purchase NFT for SOL
3. cancel_listing(listing_id) → Remove listing
4. withdraw_earnings() → Seller withdraws SOL
```

**State:**
```rust
Listing {
  listing_id: Pubkey,
  seller: Pubkey,
  nft_mint: Pubkey,
  price_sol: u64,
  created_at: i64,
  is_active: bool,
}
```

**Events:**
- `ListingCreated`
- `NFTPurchased`
- `ListingCancelled`
- `EarningsWithdrawn`

---

### Program 2: NFT Swap (NFT for NFT)

**Functions:**
```rust
1. create_swap_offer(my_nft, wanted_nft) → Propose swap
2. accept_swap_offer(offer_id) → Accept proposal
3. execute_swap(offer_id) → Execute atomic swap
4. cancel_offer(offer_id) → Cancel proposal
```

**State:**
```rust
SwapOffer {
  offer_id: Pubkey,
  offerer: Pubkey,
  offerer_nft: Pubkey,
  recipient: Pubkey,
  recipient_nft: Pubkey,
  status: OfferStatus, // Pending, Accepted, Completed
  created_at: i64,
}
```

**Events:**
- `SwapOfferCreated`
- `SwapOfferAccepted`
- `SwapExecuted`
- `SwapCancelled`

---

## DISCORD BOT SLASH COMMANDS

### Wallet Management
```
/wallet              → Show wallet address & SOL balance
/portfolio           → Show user's NFTs with images
/help                → Show all commands
```

### NFT for SOL (Listing & Buying)
```
/list <nft_mint> <price>        → List NFT for SOL
/browse [page]                  → Browse all listings (paginated)
/my-listings                    → Show your active listings
/buy <listing_id>               → Buy listed NFT
/withdraw                       → Withdraw SOL earnings
```

### NFT for NFT (Swapping)
```
/offer <my_nft> <wanted_nft>   → Create swap offer
/my-offers                      → Show your sent offers
/offers-for-me                  → Show offers on your NFTs
/accept <offer_id>              → Accept swap offer
```

### Discord-Specific Features
```
Buttons:
[Buy Now] [Cancel] [Accept] [Reject] [Execute Swap] [View Details]

Select Menus:
- Choose NFT from your wallet (for listing/offering)

Embeds:
- Rich listing cards with images
- Swap offer previews
- Portfolio display
- Transaction confirmations
```

---

## DISCORD CHANNELS STRUCTURE

Your Discord server should have:

```
📌 MARKETPLACE
├── #marketplace          - Browse all active listings
├── #swaps               - Active swap offers
└── #completed           - Finished trades (history)

📊 USER CHANNELS
├── #my-listings         - Your active listings (DM notification)
├── #my-offers           - Your pending offers (DM notification)
└── #offers-for-me       - Offers on your NFTs (DM notification)

ℹ️ INFO
├── #rules              - Marketplace rules
├── #faq                - Frequently asked questions
└── #announcements      - Important updates
```

---

## DATABASE SCHEMA

### Users Collection
```javascript
{
  _id: ObjectId,
  discord_id: String,           // Unique Discord user ID
  discord_username: String,
  wallet: String,               // Solana pubkey
  private_key: String,          // Encrypted
  sol_balance: Number,          // Cached
  nft_count: Number,
  completed_trades: Number,
  created_at: Date,
  last_active: Date,
  dm_notifications: Boolean,    // Prefer DMs?
}
```

### Listings Collection
```javascript
{
  _id: ObjectId,
  listing_id: String,           // Unique ID
  seller_discord_id: String,
  seller_wallet: String,
  seller_username: String,
  nft_mint: String,
  nft_name: String,
  nft_image: String,            // IPFS URL
  nft_collection: String,
  price_sol: Number,
  status: "active" | "sold" | "cancelled",
  created_at: Date,
  sold_at: Date | null,
  buyer_discord_id: String | null,
  buyer_wallet: String | null,
  tx_hash: String | null,
  message_id: String,           // Discord message ID for editing
}
```

### Swap Offers Collection
```javascript
{
  _id: ObjectId,
  offer_id: String,
  offerer_discord_id: String,
  offerer_wallet: String,
  offerer_username: String,
  offerer_nft: String,
  offerer_nft_name: String,
  offerer_nft_image: String,
  
  recipient_discord_id: String,
  recipient_wallet: String,
  recipient_username: String,
  recipient_nft: String,
  recipient_nft_name: String,
  recipient_nft_image: String,
  
  status: "pending" | "accepted" | "completed" | "cancelled",
  created_at: Date,
  accepted_at: Date | null,
  completed_at: Date | null,
  tx_hash: String | null,
  message_id: String,           // Discord message ID
}
```

### Transactions Collection (History)
```javascript
{
  _id: ObjectId,
  tx_hash: String,
  type: "sale" | "swap",
  seller_discord_id: String,
  buyer_discord_id: String,
  nft_mint: String,
  amount_sol: Number | null,     // For sales
  created_at: Date,
  status: "pending" | "completed" | "failed",
}
```

---

## TRANSACTION FLOWS

### Flow 1: List NFT for SOL

```
User in Discord
  ↓
Types /list <nft_mint> <5_sol>
  ↓
Discord modal opens (confirm listing)
  ↓
User submits
  ↓
Bot verifies user owns NFT
  ↓
Bot calls smart contract: list_nft(nft_mint, 5_sol)
  ↓
Smart contract locks NFT in escrow
  ↓
Bot stores listing in database
  ↓
Bot creates embed card in #marketplace
  ↓
Bot sends DM: "✅ Your NFT is listed!"
```

### Flow 2: Browse & Buy NFT

```
User in Discord #marketplace
  ↓
Sees listing embed with [Buy Now] button
  ↓
Clicks [Buy Now]
  ↓
Bot shows confirmation embed
  ↓
User clicks [Confirm Purchase]
  ↓
Bot verifies user has SOL
  ↓
Bot calls smart contract: buy_nft(listing_id)
  ↓
Smart contract:
  - NFT → Buyer
  - 5 SOL → Seller
  ↓
Bot updates database (status: "sold")
  ↓
Bot edits original embed: "SOLD ✅"
  ↓
Notify both users via DM:
  - Seller: "Your NFT sold for 5 SOL!"
  - Buyer: "Purchase complete! NFT transferred."
```

### Flow 3: Create Swap Offer

```
User in Discord
  ↓
Types /offer <my_nft> <wanted_nft>
  ↓
Bot shows select menu (choose your NFT)
  ↓
User selects their NFT
  ↓
Bot finds who owns wanted NFT (or searches blockchain)
  ↓
Bot calls smart contract: create_swap_offer(...)
  ↓
Smart contract locks user's NFT in escrow
  ↓
Bot stores offer in database
  ↓
Bot posts embed in #swaps
  ↓
Bot DMs recipient: "New swap offer for your NFT!"
  ↓
Recipient's /offers-for-me shows pending offer
```

### Flow 4: Accept Swap Offer

```
Recipient in Discord
  ↓
Types /accept <offer_id>
  ↓
Bot shows confirmation embed:
  "You'll give: [NFT] | You'll get: [NFT]"
  ↓
Recipient clicks [Accept]
  ↓
Bot calls smart contract: accept_swap_offer(...)
  ↓
Smart contract locks recipient's NFT in escrow
  ↓
Database status: "accepted"
  ↓
Both users notified:
  "Swap ready! Click [Execute] to finalize"
```

### Flow 5: Execute Swap

```
Either user
  ↓
Clicks [Execute Swap] button
  ↓
Bot calls smart contract: execute_swap(...)
  ↓
Smart contract:
  - NFT A → User B
  - NFT B → User A
  - Escrows cleared
  ↓
Bot updates database (status: "completed")
  ↓
Bot edits #swaps embed: "COMPLETED ✅"
  ↓
Both users DM'd:
  "✅ Swap complete! NFTs transferred."
```

---

## DISCORD-SPECIFIC FEATURES

### Rich Embeds
Each listing/offer shows as a beautiful card:

```
╔════════════════════════════════════╗
║ 🖼️ Pixel Art #001                  ║
║                                    ║
║ [NFT Image - 300x300px]           ║
║                                    ║
║ Price: 5 SOL                       ║
║ Seller: @User123                   ║
║ Collection: PixelArt Collection    ║
║ Floor: 3.5 SOL                     ║
║                                    ║
║ [Buy Now] [View Details]           ║
╚════════════════════════════════════╝
```

### Interactive Buttons
```
[Buy Now]      - Click to purchase
[Accept]       - Accept swap offer
[Reject]       - Reject offer
[Execute]      - Execute swap
[Cancel]       - Cancel listing/offer
[View Details] - See full NFT info
```

### Select Menus
When listing or offering, user selects NFT from dropdown:
```
Select NFT to list:
├── Pixel Art #001 (Floor: 3.5 SOL)
├── Galaxy #042 (Floor: 5.2 SOL)
├── Cool Cat #156 (Floor: 8.5 SOL)
└── ...
```

### Auto-Updated Messages
Bot edits original embed when status changes:
- "ACTIVE" → "SOLD ✅" (when purchased)
- "PENDING" → "ACCEPTED ⏳" → "COMPLETED ✅" (for swaps)

### DM Notifications
Users get private DMs for:
- Your listing sold
- New swap offer for your NFT
- Swap offer accepted
- Swap completed

---

## KEY TECHNICAL DETAILS

### Wallet Management
- Store encrypted private keys in database
- Never expose private key in logs
- Use Anchor/Solana SDK to sign transactions
- Validate wallet ownership via signature

### NFT Detection
- Query Solana RPC for user's token accounts
- Filter for NFTs (decimals = 0)
- Fetch metadata from Metaplex
- Cache in database (update on each action)

### Discord Integration
- Use discord.js v14
- Slash commands (modern approach)
- Button interactions (immediate feedback)
- Embeds (rich formatting)
- DM notifications (private alerts)
- Ephemeral responses (hide from public)

### Error Handling
- User doesn't own NFT → Error embed
- Insufficient SOL → Error embed
- Transaction fails → Refund & notify
- Wallet not connected → Guide to setup
- Permission errors → Clear message

### Security
- Validate all inputs (mint addresses, amounts)
- Check ownership before listing/swapping
- Use smart contract escrow (trustless)
- Encrypt private keys at rest
- Rate limit commands (prevent spam)
- Never show private keys in logs

---

## TECH STACK

| Layer | Technology |
|-------|------------|
| **Blockchain** | Solana (devnet/mainnet) |
| **Smart Contracts** | Anchor (Rust) |
| **Bot Framework** | discord.js v14 |
| **Language** | TypeScript |
| **Database** | MongoDB |
| **Wallet Integration** | @solana/web3.js |
| **RPC** | Helius or QuickNode (free tier) |
| **Deployment** | Railway or Replit (free) |
| **NFT Metadata** | Metaplex/IPFS |

---

## DEPLOYMENT CHECKLIST

### Smart Contracts
- [ ] Write both programs
- [ ] Test locally (`anchor test`)
- [ ] Deploy to devnet (`anchor deploy --provider.cluster devnet`)
- [ ] Record program IDs
- [ ] Update bot config with program IDs

### Discord Bot
- [ ] Create Discord application at https://discord.com/developers/applications
- [ ] Get bot token
- [ ] Setup MongoDB database (MongoDB Atlas free tier)
- [ ] Create .env file with all credentials
- [ ] Register slash commands locally (`npm run register-commands`)
- [ ] Test all commands locally (`npm run dev`)
- [ ] Deploy to server (Railway or Replit)
- [ ] Invite bot to test server
- [ ] Test end-to-end flows

### Final Testing
- [ ] Test NFT for SOL flow (list, browse, buy)
- [ ] Test NFT for NFT flow (offer, accept, execute)
- [ ] Test error cases (no NFT, no SOL, etc.)
- [ ] Test Discord features (buttons, embeds, DMs)
- [ ] Performance testing (response time)
- [ ] Demo ready

---

## ACCEPTANCE CRITERIA

### Must Have (MVP)
- [x] Connect wallet to bot (via DM)
- [x] List NFT for SOL (with /list command)
- [x] Browse listings (in #marketplace with embeds)
- [x] Buy NFT (with button click)
- [x] Create NFT swap offer (with /offer)
- [x] Accept swap offer (with /accept)
- [x] Execute swap (atomic, trustless)
- [x] Show portfolio (with /portfolio)
- [x] View wallet balance (with /wallet)
- [x] All on devnet
- [x] Fully functional, no bugs

### Nice to Have
- [ ] NFT floor price comparison
- [ ] Listing expiration (auto-cancel after X days)
- [ ] Transaction history in database
- [ ] User reputation/trust score
- [ ] Mainnet support
- [ ] Listing images cached & displayed
- [ ] Search function (/search <term>)
- [ ] Filter by collection (/browse collection:<name>)
- [ ] Leaderboard (/leaderboard)

---

## CURRENT STATUS

**Started:** Tuesday (Today)
**Deadline:** Friday (End of day)
**Progress:** 0% (starting now)
**Platform:** Discord (not Telegram)

---

## NEXT STEPS

1. **Day 1:** Build smart contracts + deploy to devnet
2. **Day 2:** Build bot commands for NFT for SOL (list, browse, buy)
3. **Day 3:** Build bot commands for NFT for NFT (offer, accept, execute) + testing
4. **Friday:** Final polish, demo ready, present to bootcamp

---

## DISCORD SETUP

### Before Coding
1. Create Discord server for testing
2. Create channels (#marketplace, #swaps, #completed, etc.)
3. Go to https://discord.com/developers/applications
4. Create new application
5. Go to "Bot" tab, create bot
6. Copy bot token → Save in .env
7. Set permissions: `Send Messages, Embed Links, Manage Messages, Read Messages`
8. Invite bot to your test server

### After Coding
1. Run command registration script
2. Test all slash commands
3. Deploy to production server

---

## ENVIRONMENT VARIABLES

```
# Discord
DISCORD_TOKEN=<bot_token_from_developer_portal>
DISCORD_CLIENT_ID=<application_id>
DISCORD_GUILD_ID=<test_server_id>

# Solana
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_CLUSTER=devnet

# Programs
NFT_MARKETPLACE_PROGRAM_ID=<deploy_and_add>
NFT_SWAP_PROGRAM_ID=<deploy_and_add>

# Database
MONGODB_URI=<connection_string>
DB_NAME=nft_marketplace

# Security
ENCRYPTION_KEY=<random_32_char_key>

# Deployment
NODE_ENV=production
PORT=3000
```

---

## IMPORTANT NOTES FOR AI ASSISTANTS

If you're an AI helping with this project:

1. **Always refer to this prompt** when building
2. **Follow the project structure** exactly
3. **Use discord.js v14** (not v13)
4. **Create rich embeds** for all listings/offers
5. **Use buttons** for user interactions
6. **Send DMs** for private notifications
7. **Handle errors gracefully** (no crashes)
8. **Test thoroughly** before deployment
9. **Keep code clean** and well-commented
10. **Security first:** Never expose private keys, validate all inputs
11. **User experience:** Make interactions smooth and intuitive
12. **Report progress** regularly to developer

---

## ADVANTAGES OF DISCORD OVER TELEGRAM

✅ **Rich UI:** Embeds, colors, images, formatting
✅ **Buttons:** Interactive without text commands
✅ **Channels:** Organize listings, swaps, completed trades
✅ **Better Notifications:** DMs + channel updates
✅ **More Scalable:** Discord API is powerful
✅ **Community Feel:** Users see activity, builds trust
✅ **Professional:** Looks polished and impressive
✅ **Skill Showcase:** Shows discord.js expertise

---

## SUPPORT CONTACTS

**Developer:** [Your name/handle]
**Project Start:** Tuesday
**Project End:** Friday EOD
**Timezone:** [Your timezone]
**Platform:** Discord Bot (discord.js v14)

---

**This prompt is the complete specification for building the Discord NFT Marketplace Bot. Share it with any AI assistant or teammate to get them up to speed instantly!**