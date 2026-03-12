const { GoogleGenerativeAI } = require("@google/generative-ai");
const { client } = require("./bot");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const tools = {
    // 1. Create Channel
    createChannel: async ({ name, type = 0, parentId, guildId }) => {
        try {
            const guild = client.guilds.cache.get(guildId);
            if (!guild) return { error: "Guild not found" };
            const channel = await guild.channels.create({
                name,
                type: Number(type),
                parent: parentId || null
            });
            return { success: true, message: `Created channel ${channel.name} (ID: ${channel.id})` };
        } catch (error) {
            return { error: error.message };
        }
    },

    // 2. Delete Channel
    deleteChannel: async ({ channelId, guildId }) => {
        try {
            const guild = client.guilds.cache.get(guildId);
            if (!guild) return { error: "Guild not found" };
            const channel = guild.channels.cache.get(channelId);
            if (!channel) return { error: "Channel not found" };
            const name = channel.name;
            await channel.delete();
            return { success: true, message: `Deleted channel ${name}` };
        } catch (error) {
            return { error: error.message };
        }
    },

    // 3. Member Management
    manageMember: async ({ action, userId, reason, guildId }) => {
        try {
            const guild = client.guilds.cache.get(guildId);
            if (!guild) return { error: "Guild not found" };
            const member = await guild.members.fetch(userId);
            if (!member) return { error: "Member not found" };

            if (action === 'kick') {
                await member.kick(reason);
                return { success: true, message: `Kicked ${member.user.tag}` };
            } else if (action === 'ban') {
                await member.ban({ reason });
                return { success: true, message: `Banned ${member.user.tag}` };
            } else if (action === 'mute' || action === 'timeout') {
                const timeInMs = 60 * 60 * 1000; // 1 hour
                await member.timeout(timeInMs, reason);
                return { success: true, message: `Timed out ${member.user.tag} for 1 hour` };
            }
            return { error: "Invalid action" };
        } catch (error) {
            return { error: error.message };
        }
    },

    // 4. Get Server Info (Context for AI)
    getServerInfo: async ({ guildId }) => {
        try {
            const guild = client.guilds.cache.get(guildId);
            if (!guild) return { error: "Guild not found" };

            const channels = await guild.channels.fetch();
            const channelsList = channels.map(c => ({
                id: c.id,
                name: c.name,
                type: c.type,
                parentId: c.parentId
            }));

            return {
                serverName: guild.name,
                memberCount: guild.memberCount,
                channels: channelsList
            };
        } catch (error) {
            return { error: error.message };
        }
    }
};

const declaration = [
    {
        name: "createChannel",
        description: "Create a new Discord channel (text, voice, or category).",
        parameters: {
            type: "object",
            properties: {
                name: { type: "string", description: "The name of the channel" },
                type: { type: "number", description: "0 for Text, 2 for Voice, 4 for Category" },
                parentId: { type: "string", description: "Optional ID of the category/parent channel" }
            },
            required: ["name"]
        }
    },
    {
        name: "deleteChannel",
        description: "Delete an existing Discord channel by its ID.",
        parameters: {
            type: "object",
            properties: {
                channelId: { type: "string", description: "The ID of the channel to delete" }
            },
            required: ["channelId"]
        }
    },
    {
        name: "manageMember",
        description: "Perform moderation actions on members (kick, ban, mute/timeout).",
        parameters: {
            type: "object",
            properties: {
                action: { type: "string", enum: ["kick", "ban", "mute"], description: "The action to perform" },
                userId: { type: "string", description: "The Discord user ID of the member" },
                reason: { type: "string", description: "Optional reason for the action" }
            },
            required: ["action", "userId"]
        }
    },
    {
        name: "getServerInfo",
        description: "Get information about the current server state, including channel list and member count.",
        parameters: {
            type: "object",
            properties: {}
        }
    }
];

async function processGeminiChat(guildId, messages, modelName = "gemini-1.5-flash", imageData = null) {
    const model = genAI.getGenerativeModel({
        model: modelName,
        tools: [{ functionDeclarations: declaration }],
        systemInstruction: `You are a helpful and professional Discord Server Manager Assistant for guild ID ${guildId}. 
        Your goal is to provide comprehensive, friendly, and detailed assistance.
        When performing actions or answering questions:
        1. Explain what you are doing in detail.
        2. Provide helpful context or suggestions when appropriate.
        3. If a task is complex, break down your response into clear steps.
        4. Always maintain a polite and professional tone.
        5. Always respond in the same language as the user (Thai in this case).
        6. Don't be too brief; ensure the user feels well-supported.
        7. If a user provides an image, analyze it carefully and answer any questions related to it.`,
        generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
        }
    });

    // Map history and ensure it starts with a 'user' role
    let history = messages.slice(0, -1).map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
    }));

    // Gemini requires the first message to be from the 'user'
    const firstUserIndex = history.findIndex(m => m.role === 'user');
    if (firstUserIndex !== -1) {
        history = history.slice(firstUserIndex);
    } else {
        history = []; // If no user message in history, start fresh
    }

    const chat = model.startChat({ history });
    const lastMessageContent = messages[messages.length - 1].content;

    // Build the request parts (Text + optional Image)
    const messageParts = [];
    if (lastMessageContent) messageParts.push({ text: lastMessageContent });
    
    if (imageData && imageData.data && imageData.mimeType) {
        messageParts.push({
            inlineData: {
                data: imageData.data,
                mimeType: imageData.mimeType
            }
        });
    }

    let result;
    let activeChat = chat;
    let isFallback = false;

    try {
        result = await activeChat.sendMessage(messageParts);
    } catch (error) {
        // If the selected model is overloaded or unavailable, fallback to a stable model
        const isUnavailable = error.message?.includes('503') || error.message?.includes('high demand') || error.message?.includes('404');
        
        if (isUnavailable && modelName !== "gemini-1.5-flash") {
            console.log(`Model ${modelName} failed, falling back to gemini-1.5-flash...`);
            const fallbackModel = genAI.getGenerativeModel({
                model: "gemini-1.5-flash",
                tools: [{ functionDeclarations: declaration }],
                systemInstruction: `You are a professional assistant. The previous model was unavailable, please help the user now.`
            });
            activeChat = fallbackModel.startChat({ history });
            result = await activeChat.sendMessage(messageParts);
            isFallback = true;
        } else {
            throw error;
        }
    }

    let response = result.response;
    const actions = [];
    let calls = response.functionCalls();
    
    while (calls && calls.length > 0) {
        const toolResults = {};
        for (const call of calls) {
            const tool = tools[call.name];
            if (tool) {
                const args = { ...call.args, guildId };
                console.log(`[Gemini Tool] Calling ${call.name} with args:`, args);
                const output = await tool(args);
                console.log(`[Gemini Tool] ${call.name} Result:`, output);
                
                toolResults[call.name] = output;
                actions.push({ name: call.name, args: call.args, status: output.error ? 'error' : 'success' });
            }
        }

        // Send back tool outputs to Gemini using the ACTIVE chat
        result = await activeChat.sendMessage(Object.entries(toolResults).map(([name, data]) => ({
            functionResponse: {
                name,
                response: data
            }
        })));
        response = result.response;
        calls = response.functionCalls();
    }

    let finalReply = response.text();
    if (isFallback) {
        finalReply = `⚠️ (ระบบสลับมาใช้รุ่นสำรองชั่วคราวเนื่องจากรุ่น "${modelName}" ไม่พร้อมใช้งาน)\n\n${finalReply}`;
    }

    return { reply: finalReply, actions };
}

module.exports = { processGeminiChat };
