import {REST, Routes, SlashCommandBuilder} from "discord.js";
import dotenv from 'dotenv';

dotenv.config();

const commands = [
    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Test if bot is working')
        .toJSON(),
    new SlashCommandBuilder()
        .setName('wallet')
        .setDescription('Show your wallet address and SOL balance')
        .toJSON(),
    new SlashCommandBuilder()
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
        )
        .toJSON(),
    new SlashCommandBuilder()
        .setName('browse')
        .setDescription('Browse all active NFT listings')
        .addIntegerOption(option =>
            option
                .setName('page')
                .setDescription('Page number')
                .setRequired(false)
        )
        .toJSON(),
]

const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);
        // The put method is used to fully refresh all commands in the guild with the current set
        const data = await rest.put(
            Routes.applicationGuildCommands(
            process.env.DISCORD_CLIENT_ID!,
            process.env.DISCORD_GUILD_ID!
        ), { body: commands });
        console.log('Commands registered successfully!');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
})();