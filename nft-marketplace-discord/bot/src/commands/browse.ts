import {
  SlashCommandBuilder,
  EmbedBuilder,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import { getAllListings } from '../services/marketplace.service';
import { getNftMetadata } from '../services/nft.service';

export const data = new SlashCommandBuilder()
  .setName('browse')
  .setDescription('Browse all active NFT listings')
  .addIntegerOption(option =>
    option
      .setName('page')
      .setDescription('Page number')
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const page = interaction.options.getInteger('page') || 1;
  const pageSize = 5;

  // Fetch active listings from blockchain
  const activeListings = await getAllListings();

  if (activeListings.length === 0) {
    await interaction.editReply('No active listings found. Use `/list` to create one!');
    return;
  }

  // Pagination
  const totalPages = Math.ceil(activeListings.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const pageListings = activeListings.slice(startIndex, startIndex + pageSize);

  // Create embeds for each listing (with metadata)
  const embeds = await Promise.all(
    pageListings.map(async (listing: any) => {
      // Fetch NFT metadata
      const metadata = await getNftMetadata(listing.nftMint);

      const embed = new EmbedBuilder()
        .setTitle(metadata?.name || 'NFT for Sale')
        .setColor(0x9945FF)
        .addFields(
          { name: 'Price', value: `${listing.price} SOL`, inline: true },
          { name: 'Seller', value: `\`${listing.seller.slice(0, 8)}...\``, inline: true },
          { name: 'Mint', value: `\`${listing.nftMint.slice(0, 8)}...\``, inline: true }
        )
        .setFooter({ text: `Listing: ${listing.listingAddress.slice(0, 8)}...` });

      // Add image if available
      if (metadata?.image) {
        embed.setThumbnail(metadata.image);
      }

      // Add description if available
      if (metadata?.description) {
        embed.setDescription(metadata.description.slice(0, 100));
      }

      return embed;
    })
  );

  // Create buy buttons for each listing
  const buttons = new ActionRowBuilder<ButtonBuilder>();
  pageListings.forEach((listing: any, index: number) => {
    buttons.addComponents(
      new ButtonBuilder()
        .setCustomId(`buy_${listing.listingAddress}`)
        .setLabel(`Buy #${startIndex + index + 1}`)
        .setStyle(ButtonStyle.Success)
    );
  });

  // Navigation buttons
  const navButtons = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`browse_${page - 1}`)
        .setLabel('Previous')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page <= 1),
      new ButtonBuilder()
        .setCustomId(`browse_${page + 1}`)
        .setLabel('Next')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page >= totalPages)
    );

  const content = `**Marketplace Listings** (Page ${page}/${totalPages})`;

  await interaction.editReply({
    content,
    embeds,
    components: [buttons, navButtons]
  });
}
