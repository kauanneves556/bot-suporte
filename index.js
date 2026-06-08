const { Client, GatewayIntentBits, ActionRowBuilder, EmbedBuilder, ChannelType, REST, Routes, ButtonBuilder, ButtonStyle } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const http = require('http');

const TOKEN = process.env.TOKEN;
const VOICE_ID = '1512999528217710693';

// Mantém o bot online
http.createServer((req, res) => { res.writeHead(200); res.end('Bot Online'); }).listen(3000);

let filaData = new Map();
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates] });

client.once('ready', async () => {
    const channel = client.channels.cache.get(VOICE_ID);
    if (channel) joinVoiceChannel({ channelId: channel.id, guildId: channel.guild.id, adapterCreator: channel.guild.voiceAdapterCreator, selfDeaf: true });
    console.log('✅ Bot Operacional!');
});

client.on('interactionCreate', async interaction => {
    // PROTEÇÃO GERAL: Se uma interação falhar, o bot não trava
    try {
        // LÓGICA DE FILAS (Isolada)
        if (interaction.isButton()) {
            const [acao, valor, cmd] = interaction.customId.split('_');
            
            // Só executa se for um botão de fila (ignora botões de ticket/loja)
            if (['infinito', 'normal', 'sair'].includes(acao)) {
                await interaction.deferUpdate(); // Evita o erro de "Interação falhou"

                const limites = { "1v1": 2, "2v2": 4, "3v3": 6, "4v4": 8 };
                const modo = cmd.replace('mob', '').replace('emu', '').replace('mis', '');
                
                const keyInf = `infinito_${valor}_${cmd}`;
                const keyNor = `normal_${valor}_${cmd}`;

                if (!filaData.has(keyInf)) filaData.set(keyInf, []);
                if (!filaData.has(keyNor)) filaData.set(keyNor, []);

                if (acao === 'sair') {
                    filaData.set(keyInf, filaData.get(keyInf).filter(id => id !== interaction.user.id));
                    filaData.set(keyNor, filaData.get(keyNor).filter(id => id !== interaction.user.id));
                } else {
                    const targetKey = (acao === 'infinito') ? keyInf : keyNor;
                    let list = filaData.get(targetKey);
                    if (!list.includes(interaction.user.id)) {
                        list.push(interaction.user.id);
                        filaData.set(targetKey, list);
                    }
                    
                    // Verifica se encheu
                    if (list.length === limites[modo]) {
                        const canal = await interaction.guild.channels.create({ name: `fila-${cmd}-${valor}`, type: ChannelType.GuildText });
                        await canal.send(`✅ Partida fechada! Jogadores: ${list.map(id => `<@${id}>`).join(', ')}`);
                        filaData.set(targetKey, []);
                    }
                }

                // Atualiza o painel visual
                const embed = EmbedBuilder.from(interaction.message.embeds[0]).setDescription(
                    `**Valor:** R$ ${valor}\n\n👤 **Gel Infinito:**\n${filaData.get(keyInf).map(id => `<@${id}>`).join('\n') || 'Ninguém.'}\n\n👤 **Gel Normal:**\n${filaData.get(keyNor).map(id => `<@${id}>`).join('\n') || 'Ninguém.'}`
                );
                await interaction.editReply({ embeds: [embed] });
            }
        }
    } catch (err) {
        console.error("Erro capturado:", err);
    }
});

client.login(TOKEN);
