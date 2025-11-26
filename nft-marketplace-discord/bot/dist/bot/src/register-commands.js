"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const commands = [
    new discord_js_1.SlashCommandBuilder()
        .setName('ping')
        .setDescription('Test if bot is working')
        .toJSON(),
    new discord_js_1.SlashCommandBuilder()
        .setName('wallet')
        .setDescription('Show your wallet address and SOL balance')
        .toJSON(),
    new discord_js_1.SlashCommandBuilder()
        .setName('list')
        .setDescription('List an NFT for sale')
        .addStringOption(option => option
        .setName('mint')
        .setDescription('NFT mint address')
        .setRequired(true))
        .addNumberOption(option => option
        .setName('price')
        .setDescription('Price in SOL')
        .setRequired(true))
        .toJSON(),
    new discord_js_1.SlashCommandBuilder()
        .setName('browse')
        .setDescription('Browse all active NFT listings')
        .addIntegerOption(option => option
        .setName('page')
        .setDescription('Page number')
        .setRequired(false))
        .toJSON(),
];
const rest = new discord_js_1.REST().setToken(process.env.DISCORD_TOKEN);
(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);
        // The put method is used to fully refresh all commands in the guild with the current set
        const data = await rest.put(discord_js_1.Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID), { body: commands });
        console.log('Commands registered successfully!');
    }
    catch (error) {
        console.error('Error registering commands:', error);
    }
})();
//# sourceMappingURL=register-commands.js.map