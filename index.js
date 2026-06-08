const { Client, GatewayIntentBits, ActionRowBuilder, EmbedBuilder, ChannelType, REST, Routes, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const http = require('http');

const TOKEN = process.env.TOKEN;
const CARGO_ID = '1512598694166528210';
const VOICE_ID = '1512999528217710693';
const LINK_FOTO = "https://cdn.discordapp.com/attachments/1512591953529803014/1512868218329632828/f44b70f9-c9a5-4c47-b6e7-15b08d369a1c.png";

http.createServer((req, res) => { res.writeHead(200); res.end('Bot Online'); }).listen(3000);

let filaData = new Map();
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates] });

client.once('ready', async () => {
    const channel = client.channels.cache.get(VOICE_ID);
    if (channel) joinVoiceChannel({ channelId: channel.id, guildId: channel.guild.id, adapterCreator: channel.guild.voiceAdapterCreator, selfDeaf: true });
    
    const commands = [
        { name: 'mob1v1', description: 'Fila 1v1' }, { name: 'mob2v2', description: 'Fila 2v2' },
        { name: 'mob3v3', description: 'Fila 3v3' }, { name: 'mob4v4', description: 'Fila 4v4' },
        { name: 'setup-ticket', description: 'Painel suporte' }, { name: 'setup-loja', description: 'Painel loja' }
    ];
    await new REST({ version: '10' }).setToken(TOKEN).put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('✅ Bot Reduto Operacional 24h!');
});

client.on('interactionCreate', async interaction => {
    // 1. COMANDOS (MODOS E PAINÉIS)
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName.startsWith('mob')) {
            const modo = interaction.commandName.replace('mob', '');
            const vals = ["100,00", "50,00", "20,00", "10,00", "5,00", "3,00", "2,00", "1,00", "0,50", "0,30"];
            for (const v of vals) {
                const embed = new EmbedBuilder().setTitle(`🎮 FILA ${modo.toUpperCase()} MOBILE`).setColor('#000000').setThumbnail(LINK_FOTO)
                    .setDescription(`**Valor:** R$ ${v}\n\n👤 **Gel Infinito:** Ninguém.\n👤 **Gel Normal:** Ninguém.`);
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`infinito_${v}_${modo}`).setLabel('Gel Infinito').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId(`normal_${v}_${modo}`).setLabel('Gel Normal').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId(`sair_${v}_${modo}`).setLabel('Sair').setStyle(ButtonStyle.Danger)
                );
                await interaction.channel.send({ embeds: [embed], components: [row] });
            }
            return interaction.reply({ content: `✅ Painéis ${modo} criados.`, ephemeral: true });
        }
        // COLE SEUS COMANDOS ORIGINAIS DE LOJA/TICKET AQUI SE PRECISAR
    }

    // 2. BOTÕES DE FILA
    if (interaction.isButton()) {
        const [acao, valor, modo] = interaction.customId.split('_');
        const limites = { "1v1": 2, "2v2": 4, "3v3": 6, "4v4": 8 };
        
        if (acao === 'infinito' || acao === 'normal' || acao === 'sair') {
            const key = `${acao}-${valor}-${modo}`;
            if (!filaData.has(key)) filaData.set(key, []);
            
            if (acao === 'sair') {
                filaData.set(`infinito-${valor}-${modo}`, (filaData.get(`infinito-${valor}-${modo}`) || []).filter(id => id !== interaction.user.id));
                filaData.set(`normal-${valor}-${modo}`, (filaData.get(`normal-${valor}-${modo}`) || []).filter(id => id !== interaction.user.id));
                await interaction.reply({ content: '❌ Você saiu da fila.', ephemeral: true });
            } else {
                let list = filaData.get(key);
                if (list.includes(interaction.user.id)) return interaction.reply({ content: '❌ Já está na fila!', ephemeral: true });
                list.push(interaction.user.id);
                filaData.set(key, list);

                if (list.length === limites[modo]) {
                    const canal = await interaction.guild.channels.create({ name: `fila-${modo}-${valor}`, type: ChannelType.GuildText });
                    await canal.send(`✅ Partida fechada (${modo})! Jogadores: ${list.map(id => `<@${id}>`).join(', ')}`);
                    filaData.set(key, []);
                    await interaction.reply({ content: `✅ Ticket criado: ${canal}`, ephemeral: true });
                } else {
                    await interaction.reply({ content: `✅ Entrou na fila Gel ${acao} (${list.length}/${limites[modo]})!`, ephemeral: true });
                }
            }
            
            const embed = EmbedBuilder.from(interaction.message.embeds[0]).setDescription(
                `**Valor:** R$ ${valor}\n\n👤 **Gel Infinito:**\n${(filaData.get(`infinito-${valor}-${modo}`) || []).map(id => `<@${id}>`).join('\n') || 'Ninguém.'}\n\n👤 **Gel Normal:**\n${(filaData.get(`normal-${valor}-${modo}`) || []).map(id => `<@${id}>`).join('\n') || 'Ninguém.'}`
            );
            await interaction.message.edit({ embeds: [embed] }).catch(() => {});
        }
    }
});

client.login(TOKEN);
