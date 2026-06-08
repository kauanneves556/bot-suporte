const { Client, GatewayIntentBits, ActionRowBuilder, EmbedBuilder, ChannelType, REST, Routes, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const http = require('http');

// Configurações
const TOKEN = process.env.TOKEN;
const CARGO_ID = '1512598694166528210';
const LOGS_ID = '1512516747390091496';
const VOICE_ID = '1512999528217710693';
const LINK_FOTO = "https://cdn.discordapp.com/attachments/1512591953529803014/1512868218329632828/f44b70f9-c9a5-4c47-b6e7-15b08d369a1c.png";

// Servidor Keep-Alive (não apague, é o que mantém o bot ligado na render/vps)
http.createServer((req, res) => { res.writeHead(200); res.end('Bot Online'); }).listen(3000);

let filaData = new Map();
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates] });

client.once('ready', async () => {
    console.log('✅ Bot Reduto Iniciado!');
    // Mantendo a conexão na call
    const channel = client.channels.cache.get(VOICE_ID);
    if (channel) {
        joinVoiceChannel({ channelId: channel.id, guildId: channel.guild.id, adapterCreator: channel.guild.voiceAdapterCreator, selfDeaf: true });
    }
    
    // Registra comandos
    const commands = [
        { name: 'mob1v1', description: 'Painéis fila 1v1' },
        { name: 'setup-ticket', description: 'Painel suporte' },
        { name: 'setup-loja', description: 'Painel loja' }
    ];
    await new REST({ version: '10' }).setToken(TOKEN).put(Routes.applicationCommands(client.user.id), { body: commands });
});

client.on('interactionCreate', async interaction => {
    try {
        // COMANDOS DE PAINEL
        if (interaction.isChatInputCommand()) {
            if (interaction.commandName === 'mob1v1') {
                const vals = ["100,00", "50,00", "20,00", "10,00", "5,00", "3,00", "2,00", "1,00", "0,50", "0,30"];
                for (const v of vals) {
                    const embed = new EmbedBuilder().setTitle("🎮 FILA 1V1 MOBILE").setColor('#000000').setThumbnail(LINK_FOTO)
                        .setDescription(`**Valor:** R$ ${v}\n\n👤 **Fila Gel Infinito:**\nNinguém.\n\n👤 **Fila Gel Normal:**\nNinguém.`);
                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId(`infinito_${v}`).setLabel('Gel Infinito').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId(`normal_${v}`).setLabel('Gel Normal').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId(`sair_${v}`).setLabel('Sair').setStyle(ButtonStyle.Danger)
                    );
                    await interaction.channel.send({ embeds: [embed], components: [row] });
                }
                await interaction.reply({ content: '✅ Painéis enviados.', ephemeral: true });
            }
            // AQUI VOCÊ PODE COLOCAR SEUS OUTROS COMMANDS SE PRECISAR
        }

        // BOTÕES DE FILA
        if (interaction.isButton()) {
            const [acao, valor] = interaction.customId.split('_');
            if (acao === 'infinito' || acao === 'normal' || acao === 'sair') {
                const keyInf = `infinito-${valor}`;
                const keyNor = `normal-${valor}`;
                if (!filaData.has(keyInf)) filaData.set(keyInf, []);
                if (!filaData.has(keyNor)) filaData.set(keyNor, []);

                let list = (acao === 'infinito') ? filaData.get(keyInf) : filaData.get(keyNor);

                if (acao === 'sair') {
                    filaData.set(keyInf, filaData.get(keyInf).filter(id => id !== interaction.user.id));
                    filaData.set(keyNor, filaData.get(keyNor).filter(id => id !== interaction.user.id));
                } else {
                    if (list.includes(interaction.user.id)) return interaction.reply({ content: '❌ Você já está nesta fila!', ephemeral: true });
                    list.push(interaction.user.id);
                }

                // Atualiza painel
                const embed = EmbedBuilder.from(interaction.message.embeds[0]).setDescription(
                    `**Valor:** R$ ${valor}\n\n👤 **Fila Gel Infinito:**\n${filaData.get(keyInf).map(id => `<@${id}>`).join('\n') || 'Ninguém.'}\n\n👤 **Fila Gel Normal:**\n${filaData.get(keyNor).map(id => `<@${id}>`).join('\n') || 'Ninguém.'}`
                );
                await interaction.update({ embeds: [embed] }).catch(() => {});
            }
        }
    } catch (e) {
        console.error("Erro no bot:", e);
    }
});

client.login(TOKEN);
