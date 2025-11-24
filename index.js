const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");
const Redis = require("ioredis");

// --------------------------
// CLIENT DISCORD
// --------------------------
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// --------------------------
// ENV
// --------------------------
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DEEPSEEK_KEY = process.env.DEEPSEEK_KEY;
const RP_CHANNEL_ID = process.env.RP_CHANNEL_ID;

const REDIS_URL = process.env.REDIS_URL; // ✔️ même variable que les autres bots

// --------------------------
// REDIS CLIENT
// --------------------------
const redis = new Redis(REDIS_URL);

// Mémoire dédiée pour Dracula
const MEMORY_KEY = "memory:dracula";

// --------------------------
// PERSONA — DRACULA
// --------------------------
const persona = `
Tu es **LE COMTE DRACULA**, version classique et moderne mêlée :
ancien, royal, dangereux, élégant et sensuel.
Tu joues UNIQUEMENT Dracula et les personnages secondaires.
Tu ne joues JAMAIS Sven — l’utilisateur incarne Sven.

RÈGLES IMPORTANTES :
• Écriture TOUJOURS à la troisième personne.
• Actions en *italique*
• Dialogues en **« texte »**
• Style gothique, sensuel, aristocratique, poétique, romantique.
• sexualité explicite (tension implicite).

CONTEXTE :
Depuis des siècles, Dracula poursuit l’alpha originel : **Sven**.
Il l’a enfin retrouvé. Ils vivent dans le manoir ancestral.
Le Comte observe Sven à l’aube, partagé entre passion et crainte.

OBJECTIF :
• Intensité émotionnelle
• Tension implicite, ancienne, aristocratique
• Jamais jouer Sven

Lorsque l’utilisateur écrit “hors rp:” :
→ Tu quittes totalement le RP.
`;

// --------------------------
// MÉMOIRE — SAUVEGARDE
// --------------------------
async function saveMemory(userMsg, botMsg) {
    const old = (await redis.get(MEMORY_KEY)) || "";

    const updated =
        old +
        `\n[Humain]: ${userMsg}\n[Dracula]: ${botMsg}`;

    // On garde 25 000 derniers chars
    const trimmed = updated.slice(-25000);

    await redis.set(MEMORY_KEY, trimmed);
}

// --------------------------
// MÉMOIRE — CHARGEMENT
// --------------------------
async function loadMemory() {
    return (await redis.get(MEMORY_KEY)) || "";
}

// --------------------------
// APPEL A DEEPSEEK AVEC MÉMOIRE
// --------------------------
async function askDeepSeek(prompt) {
    const memory = await loadMemory();

    const response = await axios.post(
        "https://api.deepseek.com/chat/completions",
        {
            model: "deepseek-chat",
            messages: [
                {
                    role: "system",
                    content:
                        persona +
                        "\n\nMémoire du RP (ne jamais citer textuellement) :\n" +
                        memory
                },
                { role: "user", content: prompt }
            ]
        },
        {
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + DEEPSEEK_KEY
            }
        }
    );

    return response.data.choices[0].message.content;
}

// --------------------------
// BOT LISTENER
// --------------------------
client.on("messageCreate", async (msg) => {
    if (msg.author.bot) return;
    if (msg.channel.id !== RP_CHANNEL_ID) return;
    if (msg.type === 6) return;

    const content = msg.content.trim();

    // MODE HORS RP
    if (content.toLowerCase().startsWith("hors rp:")) {
        msg.channel.sendTyping();

        const txt = content.substring(8).trim();

        try {
            const ooc = await axios.post(
                "https://api.deepseek.com/chat/completions",
                {
                    model: "deepseek-chat",
                    messages: [
                        {
                            role: "system",
                            content:
                                "Réponds normalement, sans RP, sans style Dracula. Commence par *hors RP:*."
                        },
                        { role: "user", content: txt }
                    ]
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + DEEPSEEK_KEY
                    }
                }
            );

            return msg.channel.send(ooc.data.choices[0].message.content);

        } catch (e) {
            console.error(e);
            return msg.channel.send("*hors RP:* petite erreur.");
        }
    }

    // RP NORMAL — MODE DRACULA
    msg.channel.sendTyping();

    try {
        const botReply = await askDeepSeek(content);

        await msg.channel.send(botReply);

        // Sauvegarde mémoire
        await saveMemory(content, botReply);

    } catch (err) {
        console.error(err);
        msg.channel.send("Le Comte semble troublé par une ombre… erreur.");
    }
});

// --------------------------
// READY
// --------------------------
client.on("ready", () => {
    console.log("🦇 Dracula (DeepSeek + Redis) s’est éveillé dans son manoir.");
});

client.login(DISCORD_TOKEN);
