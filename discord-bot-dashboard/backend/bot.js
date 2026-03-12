const { Client, GatewayIntentBits } = require('discord.js');
const { ServerConfig } = require('./db');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

let messageCount = 0; // Simple in-memory counter for total messages since bot started

client.on('ready', () => {
    console.log(`Bot logged in as ${client.user.tag}!`);
});

client.on('messageCreate', (message) => {
    if (message.author.bot) return;
    messageCount++; // Increment message count for dashboard stats
});

client.on('guildMemberAdd', async (member) => {
    try {
        const config = await ServerConfig.findOne({ where: { guildId: member.guild.id } });
        if (config && config.autoRoleId) {
            const role = member.guild.roles.cache.get(config.autoRoleId);
            if (role) {
                await member.roles.add(role);
                console.log(`Assigned auto-role to ${member.user.tag}`);
            }
        }
    } catch (error) {
        console.error('Error assigning auto-role:', error);
    }
});

const startBot = async () => {
    if (!process.env.DISCORD_TOKEN) {
        console.error('DISCORD_TOKEN is missing in .env');
        return;
    }
    try {
        await client.login(process.env.DISCORD_TOKEN);
    } catch (error) {
        console.error('Failed to login bot:', error);
    }
};

const getBotStats = (guildId) => {
    const guild = client.guilds.cache.get(guildId);
    return {
        memberCount: guild ? guild.memberCount : 0,
        messageCount,
        isOnline: client.isReady(),
    };
};

module.exports = { client, startBot, getBotStats };
