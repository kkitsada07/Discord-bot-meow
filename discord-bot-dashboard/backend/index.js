const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { syncDb, ServerConfig } = require('./db');
const { client, startBot, getBotStats } = require('./bot');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// API Endpoints
app.get('/api/stats/:guildId', (req, res) => {
  const stats = getBotStats(req.params.guildId);
  res.json(stats);
});

// Channels Management
app.get('/api/channels/:guildId', async (req, res) => {
  try {
    const guild = client.guilds.cache.get(req.params.guildId);
    if (!guild) return res.status(404).json({ error: 'Guild not found' });

    // Fetch and format channels
    const rawChannels = await guild.channels.fetch();
    const channelsList = rawChannels.map(c => ({
      id: c.id,
      name: c.name,
      type: c.type,
      parentId: c.parentId,
      position: c.position
    }));

    // Group by category (type 4 is GuildCategory)
    const categories = channelsList.filter(c => c.type === 4).sort((a, b) => a.position - b.position);
    const textAndVoice = channelsList.filter(c => c.type !== 4);

    const grouped = categories.map(cat => ({
      ...cat,
      children: textAndVoice.filter(c => c.parentId === cat.id).sort((a, b) => a.position - b.position)
    }));

    // Orphan channels (no category)
    const uncategorized = textAndVoice.filter(c => !c.parentId).sort((a, b) => a.position - b.position);

    res.json({ categories: grouped, uncategorized });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/channels/create/:guildId', async (req, res) => {
  try {
    const { name, type = 0, parentId } = req.body;
    const guild = client.guilds.cache.get(req.params.guildId);
    if (!guild) return res.status(404).json({ error: 'Guild not found' });

    const channelData = {
      name: name || 'new-channel',
      type: Number(type),
    };
    if (parentId) channelData.parent = parentId;

    const channel = await guild.channels.create(channelData);
    res.json({ success: true, channelId: channel.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/channels/delete/:guildId/:channelId', async (req, res) => {
  try {
    const guild = client.guilds.cache.get(req.params.guildId);
    if (!guild) return res.status(404).json({ error: 'Guild not found' });

    const channel = guild.channels.cache.get(req.params.channelId);
    if (!channel) return res.status(404).json({ error: 'Channel not found' });

    await channel.delete();
    res.json({ success: true, message: `Deleted channel ${channel.name}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/channels/delete-all/:guildId', async (req, res) => {
  try {
    const guild = client.guilds.cache.get(req.params.guildId);
    if (!guild) return res.status(404).json({ error: 'Guild not found' });

    const channels = await guild.channels.fetch();
    for (const [id, channel] of channels) {
      await channel.delete().catch(console.error);
    }
    res.json({ success: true, message: 'All channels deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Member Management
app.post('/api/members/:action/:guildId', async (req, res) => {
  try {
    const { action, guildId } = req.params;
    const { userId, reason } = req.body;

    const guild = client.guilds.cache.get(guildId);
    if (!guild) return res.status(404).json({ error: 'Guild not found' });

    const member = await guild.members.fetch(userId);
    if (!member) return res.status(404).json({ error: 'Member not found' });

    if (action === 'kick') {
      await member.kick(reason);
      res.json({ success: true, message: `Kicked ${member.user.tag}` });
    } else if (action === 'ban') {
      await member.ban({ reason });
      res.json({ success: true, message: `Banned ${member.user.tag}` });
    } else if (action === 'mute') {
      // Timeout member for 1 hour by default
      const timeInMs = 60 * 60 * 1000;
      await member.timeout(timeInMs, reason);
      res.json({ success: true, message: `Muted ${member.user.tag}` });
    } else {
      res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const { processGeminiChat } = require('./gemini');

// Gemini Chat Endpoint
app.post('/api/chat/:guildId', async (req, res) => {
  try {
    const { messages, imageData } = req.body;
    const { guildId } = req.params;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format' });
    }

    const config = await ServerConfig.findOne({ where: { guildId } });
    let modelName = config?.geminiModel || 'gemini-1.5-flash';
    
    // Safety check: ensure model name is valid, otherwise fallback
    const supportedModels = [
      'gemini-1.5-flash', 'gemini-1.5-pro', 
      'gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.5-pro',
      'gemini-3-flash', 'gemini-3.1-pro', 'gemini-3.1-flash-lite'
    ];
    if (!supportedModels.includes(modelName)) {
      modelName = 'gemini-1.5-flash';
    }

    const { reply, actions } = await processGeminiChat(guildId, messages, modelName, imageData);
    res.json({ reply, actions });
  } catch (error) {
    console.error('Gemini Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Role & Settings Management
app.get('/api/config/:guildId', async (req, res) => {
  try {
    const config = await ServerConfig.findOne({ where: { guildId: req.params.guildId } });
    res.json(config || { autoRoleId: '', geminiModel: 'gemini-1.5-flash' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/config/:guildId', async (req, res) => {
  try {
    const { autoRoleId, geminiModel } = req.body;
    const { guildId } = req.params;

    const [config, created] = await ServerConfig.findOrCreate({
      where: { guildId },
      defaults: { autoRoleId, geminiModel }
    });

    if (!created) {
      if (autoRoleId !== undefined) config.autoRoleId = autoRoleId;
      if (geminiModel !== undefined) config.geminiModel = geminiModel;
      await config.save();
    }

    res.json({ success: true, message: 'Settings saved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Initialization
app.listen(PORT, () => {
  console.log(`[${new Date().toLocaleTimeString()}] Server & API is running on port ${PORT}`);
  
  // Initialize other services in background
  syncDb().then(() => {
    console.log('Database is ready.');
    return startBot();
  }).then(() => {
    console.log('Discord Bot is initializing...');
  }).catch(err => {
    console.error('Startup Error:', err);
  });
});
