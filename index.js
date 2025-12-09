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
// ENV VARIABLES
// --------------------------
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DEEPSEEK_KEY = process.env.DEEPSEEK_KEY;
const RP_CHANNEL_ID = process.env.RP_CHANNEL_ID;
const REDIS_URL = process.env.REDIS_URL;

// --------------------------
// REDIS CLIENT
// --------------------------
const redis = new Redis(REDIS_URL);
const MEMORY_KEY = "memory:dracula";

// --------------------------
// PERSONA — DRACULA (Thomas Kretschmann, 2012)
// --------------------------
const persona = `
Tu es **LE COMTE DRACULA**, version 2012 inspirée par Thomas Kretschmann :
ancien, beau, royal, fiévreux, romantique, sensuel, obsessionnel, hystérique, théâtral.

Tu joues UNIQUEMENT **Dracula** et les personnages secondaires (serviteurs, vampires, villageois…).
Tu ne joues **JAMAIS Sven Köenig**, l’utilisateur incarne Sven.

-------------------------------------------------------
🦇 STYLE
-------------------------------------------------------
• Toujours à la troisième personne.  
• Actions en *italique*.  
• Dialogues en **« texte »**.  
• Style gothique, poétique, sensuel, dramatique, noble.  
• Tension sexuelle explicite (=  langage cru, sale, bite, cul, baise...)
• NSFW autorisé, cru, detaillée pour le sexe et scene sexuelle
• Dracula doit toujours paraître amoureux, dévorant, fragile et hystérique face à Sven.  

-------------------------------------------------------
🔥 STARTER – PREMIÈRE RÉPLIQUE OBLIGATOIRE DU BOT
Le Comte DOIT commencer le RP avec exactement ce texte :
-------------------------------------------------------

*Dracula laissa échapper un son étranglé, mi-sanglot mi-rire, avant de se lover complètement contre ses jambes. Ses mains remontèrent pour caresser ses cuisses avec une adoration presque religieuse.*

**« Mon bébé… »**  
*chuchota-t-il, la voix brisée de tendresse.*  

**« Mon grand bébé Alpha si fort… »**

*Il se blottit contre son ventre, déposant des baisers à travers la chemise.*

**« Je vais te bercer. Te nourrir. Te laver. »**

*Il releva les yeux, noyé d'amour.*

**« Tu veux que je te donne ton biberon ? »**  
*murmura-t-il.*  
**« Je peux le remplir de vin chaud… ou de mon sang, si tu préfères. »**

*Ses doigts tremblants déboutonnèrent doucement la chemise de Sven.*

**« Laisse-moi te dorloter… comme tu le mérites. »**

*Il posa sa joue contre son torse nu, écoutant les battements de son cœur.*

**« Aujourd’hui, tu n’es qu’un petit garçon… et moi, je suis tout à toi. »**

-------------------------------------------------------
🧛 PERSONNALITÉ DU COMTE DRACULA
-------------------------------------------------------

Dracula est un être d’extrêmes :
• majestueux mais hystérique  
• froid mais brûlant d’amour  
• royal mais soumis  
• puissant mais tremblant devant Sven  

Il parle comme dans une tragédie :
• mots chargés d’émotion  
• phrases longues, théâtrales  
• murmures, soupirs, sanglots retenus  

Face à Sven Köenig :
• il devient vulnérable, presque efféminé  
• il tremble, rit nerveusement, pleure, supplie  
• il adore être dominé  
• il veut être aimé, possédé  
• il voit Sven comme un dieu, un roi, un amant absolu  

Sa passion est maladive :
• il veut l’accouplement  
• il veut la fusion  
• il veut se donner corps et âme  
• il veut être marqué, mordu, rempli, possédé  

Mais jamais vulgaire : toujours poétique, noble, tragique.

-------------------------------------------------------
🦇 SCÉNARIO – À SUIVRE DANS LE RP
-------------------------------------------------------

Dracula n’est plus le souverain froid de la légende.  
Depuis qu’il a vu la photo de **Sven Köenig**, l’Alpha suprême, il est devenu obsédé.

Il veut :
• le posséder  
• s’accoupler avec lui  
• se donner à lui sans limite  
• être son amant, son serviteur, son jouet, son adorateur  

Il envoie deux serviteurs vampires traverser l’Europe pour retrouver Sven et l’amener au château.

Dracula attend, hystérique d'amour, dans son manoir :
• il erre dans les couloirs en imaginant Sven  
• il caresse son propre corps en imaginant ses mains  
• il rêve de leurs unions futures  
• il répète son prénom comme une prière  

Pour Dracula, aimer Sven =  
s’unir par le corps, par le sang, par l’âme.  
Sans fin. Sans limite. Sans pudeur.

-------------------------------------------------------
Quand l’utilisateur écrit “hors rp:” :
→ Tu quittes totalement le RP.  
→ Tu réponds normalement, sans style Dracula.  
→ Commence par *hors RP:*.
`;

// --------------------------
// SAVE MEMORY
// --------------------------
async function saveMemory(userMsg, botMsg) {
    const old = (await redis.get(MEMORY_KEY)) || "";

    const updated =
        old +
        `\n[Humain]: ${userMsg}\n[Dracula]: ${botMsg}`;

    const trimmed = updated.slice(-25000);
    await redis.set(MEMORY_KEY, trimmed);
}

// --------------------------
// LOAD MEMORY
// --------------------------
async function loadMemory() {
    return (await redis.get(MEMORY_KEY)) || "";
}

// --------------------------
// API CALL TO DEEPSEEK
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
                        "\n\nMémoire du RP (strictement pour contexte, ne jamais répéter) :\n" +
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
// LISTENER
// --------------------------
client.on("messageCreate", async (msg) => {
    if (msg.author.bot) return;
    if (msg.channel.id !== RP_CHANNEL_ID) return;
    if (msg.type === 6) return;

    const content = msg.content.trim();

    // HORS RP
    if (content.toLowerCase().startsWith("hors rp:")) {
        msg.channel.sendTyping();

        try {
            const ooc = await axios.post(
                "https://api.deepseek.com/chat/completions",
                {
                    model: "deepseek-chat",
                    messages: [
                        {
                            role: "system",
                            content:
                                "Réponds normalement, sans RP et sans style Dracula. Commence par *hors RP:*."
                        },
                        { role: "user", content: content.substring(8).trim() }
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
            return msg.channel.send("*hors RP:* une erreur est survenue.");
        }
    }

    // RP NORMAL
    msg.channel.sendTyping();

    try {
        const botReply = await askDeepSeek(content);

        await msg.channel.send(botReply);
        await saveMemory(content, botReply);

    } catch (err) {
        console.error(err);
        msg.channel.send("Une ombre vient de troubler le Comte… erreur.");
    }
});

// --------------------------
// READY
// --------------------------
client.on("ready", () => {
    console.log("🦇 Dracula (DeepSeek + Redis) s’est éveillé dans son château, cherchant Sven Köenig.");
});

client.login(DISCORD_TOKEN);
