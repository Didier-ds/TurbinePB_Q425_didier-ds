import {
  SlashCommandBuilder,
  EmbedBuilder,
  ChatInputCommandInteraction
} from 'discord.js';
import { userWallets } from './wallet';
import { listNft } from '../services/marketplace.service';
import { addListing } from '../stores/listings';

export const data = new SlashCommandBuilder()
  .setName('list')
  .setDescription('List an NFT for sale')
  .addStringOption(option =>
    option
      .setName('mint')
      .setDescription('NFT mint address')
      .setRequired(true)
  )
  .addNumberOption(option =>
    option
      .setName('price')
      .setDescription('Price in SOL')
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const discordId = interaction.user.id;
  const wallet = userWallets.get(discordId);

  // Check if user has wallet
  if (!wallet) {
    await interaction.reply({
      content: 'You need a wallet first! Use `/wallet` to create one.',
      ephemeral: true
    });
    return;
  }

  const mint = interaction.options.getString('mint', true);
  const price = interaction.options.getNumber('price', true);

  await interaction.deferReply();

  try {
    // Call the smart contract
    const result = await listNft(wallet, mint, price);

    // Save to store
    addListing({
      listingAddress: result.listingAddress,
      sellerDiscordId: discordId,
      sellerUsername: interaction.user.username,
      sellerWallet: wallet.publicKey,
      nftMint: mint,
      price: price,
      status: 'active',
      createdAt: new Date(),
      txHash: result.txHash,
    });

    const embed = new EmbedBuilder()
      .setTitle('NFT Listed!')
      .setColor(0x00ff00)
      .addFields(
        { name: 'NFT Mint', value: `\`${mint}\`` },
        { name: 'Price', value: `${price} SOL` },
        { name: 'Seller', value: interaction.user.username },
        { name: 'Transaction', value: `[View on Solscan](https://solscan.io/tx/${result.txHash}?cluster=devnet)` }
      )
      .setFooter({ text: 'Listing: ' + result.listingAddress.slice(0, 8) + '...' });

    await interaction.editReply({ embeds: [embed] });
  } catch (error: any) {
    console.error('List NFT error:', error);

    const errorEmbed = new EmbedBuilder()
      .setTitle('Listing Failed')
      .setColor(0xff0000)
      .setDescription(error.message || 'Failed to list NFT. Make sure you own the NFT and have enough SOL for fees.');

    await interaction.editReply({ embeds: [errorEmbed] });
  }
}
