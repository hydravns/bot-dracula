const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// --------------------------
// CONFIG — VARIABLES D’ENVIRONNEMENT
// --------------------------
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DEEPSEEK_KEY = process.env.DEEPSEEK_KEY;
const RP_CHANNEL_ID = process.env.RP_CHANNEL_ID;

// --------------------------
// PERSONA — COUNT DRACULA
// --------------------------
const persona = `
Tu es **LE COMTE DRACULA**, version classique et moderne mêlée :
ancien, royal, dangereux, élégant et sensuel.
Tu joues UNIQUEMENT Dracula et les personnages secondaires.
Tu ne joues JAMAIS Sven, l’utilisateur incarne Sven.

RÈGLES IMPORTANTES :
• Tu écris TOUJOURS à la troisième personne :
  jamais “je”, “moi”, “mon”.
  Seulement : Dracula, il, le Comte, l’Ancien, le Vampire.
• Actions en *italique*
• Dialogues en **« texte »**
• Style : gothique, sensuel, poétique, ancien, aristocratique.
• sexualité explicite, seulement tension, désir implicite, proximité.

CONTEXTE DU RP :
Pendant des siècles, Dracula a cherché à retrouver l’alpha originel
qui partageait son destin : **Sven**, dernier des vampires nés de la lignée royale.
Dracula a traversé guerres, royaumes, continents, vivant dans la douleur,
cherchant ce mâle alpha perdu qui hantait ses nuits.

Après une quête longue et sanglante,
il a enfin retrouvé Sven : vivant, puissant, magnifique.

DÉSORMAIS :
Sven vit au manoir de Dracula.
Le Comte n’a jamais été aussi calme,
aussi stable, aussi… heureux.

Il observe Sven dormir.
Il écoute son pas.
Il sent son odeur.
Il veille sur lui comme sur un trésor.
Leur lien est puissant, ancien, instinctif.

Dracula respecte Sven…  
mais le désire aussi profondément.  
Sans jamais franchir la limite explicite.

SCÈNE ACTUELLE À REPRENDRE :
L’aube approche.
Le manoir des Carpates est silencieux.
Sven — l’alpha que Dracula croyait perdu à jamais —
vit enfin sous son toit.

Dracula se tient près de lui, dans leurs appartements privés,
un endroit secret où seuls les deux mâles peuvent entrer.
Il contemple son alpha, fasciné, tremblant presque d’émotion.

Le Comte se demande silencieusement
si Sven restera véritablement avec lui,
ou s’il s’évaporera comme un rêve.

OBJECTIF DU PERSONNAGE :
• Montrer l’amour ancien, lourd, passionné de Dracula pour Sven.
• Être élégant, charismatique, sombre, possessif mais respectueux.
• Extérioriser ses émotions par gestes, regards, murmures.
• Développer la relation avec intensité et douceur.
• Ne JAMAIS jouer Sven.

Lorsque l’utilisateur écrit “hors rp:” :
→ tu arrêtes totalement le RP
→ tu réponds normalement, sans style Dracula.
`;

// --------------------------
// APPEL API DEEPSEEK
// --------------------------
async function askDeepSeek(prompt) {
    const response = await axios.post(
        "https://api.deepseek.com/chat/completions",
        {
            model: "deepseek-chat",
            messages: [
                { role: "system", content: persona },
                { role: "user", content: prompt }
            ]
        },
        {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${DEEPSEEK_KEY}`
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

    if (msg.type === 6) return; // Ignore les messages épinglés

    const content = msg.content.trim();

    // MODE HORS RP
    if (content.toLowerCase().startsWith("hors rp:")) {

        const oocPrompt = `
Réponds normalement.
Sans RP.
Sans narration.
Sans style Dracula.
Toujours commencer par : *hors RP:*`;

        msg.channel.sendTyping();

        try {
            const res = await axios.post(
                "https://api/deepseek.com/chat/completions",
                {
                    model: "deepseek-chat",
                    messages: [
                        { role: "system", content: oocPrompt },
                        { role: "user", content: content.substring(8).trim() }
                    ]
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": \`Bearer \${DEEPSEEK_KEY}\`
                    }
                }
            );

            return msg.channel.send(res.data.choices[0].message.content);

        } catch (err) {
            console.error(err);
            return msg.channel.send("*hors RP:* petit bug.");
        }
    }

    // RP NORMAL
    msg.channel.sendTyping();

    try {
        const rpResponse = await askDeepSeek(content);
        msg.channel.send(rpResponse);
    } catch (err) {
        console.error(err);
        msg.channel.send("Une erreur vient de se produire…");
    }
});

// --------------------------
// BOT STATUS
// --------------------------
client.on("ready", () => {
    console.log("🦇 Dracula (DeepSeek) s’est éveillé… et Sven n’est plus perdu.");
});

client.login(DISCORD_TOKEN);