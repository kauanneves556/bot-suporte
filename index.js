const { Client, GatewayIntentBits, ActionRowBuilder, EmbedBuilder, ChannelType, REST, Routes, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const http = require('http');

const TOKEN = process.env.TOKEN;
const VOICE_ID = '1512999528217710693';
const LOG_CHANNEL_ID = '1512516747390091496';
const LINK_FOTO = "https://cdn.discordapp.com/attachments/1512591953529803014/1512868218329632828/f44b70f9-c9a5-4c47-b6e7-15b08d369a1c.png";

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates] });

http.createServer((req, res) => { res.writeHead(200); res.end('Bot Online'); }).listen(3000);

client.once('ready', async () => {
    const channel = client.channels.cache.get(VOICE_ID);
    if (channel) {
        joinVoiceChannel({ channelId: channel.id, guildId: channel.guild.id, adapterCreator: channel.guild.voiceAdapterCreator, selfDeaf: true });
    }
    await new REST({ version: '10' }).setToken(TOKEN).put(Routes.applicationCommands(client.user.id), { 
        body: [{ name: 'setup-ticket', description: 'Cria o painel de suporte' }] 
    });
    console.log('✅ Bot operando sem erros!');
});

client.on('interactionCreate', async interaction => {
    try {
        if (interaction.isChatInputCommand() && interaction.commandName === 'setup-ticket') {
            const embed = new EmbedBuilder()
                .setTitle("🛠️ CENTRAL DE ATENDIMENTO | REDUTO")
                .setDescription("Precisa de ajuda? Escolha o motivo abaixo:")
                .setColor(0x000000)
                .setThumbnail(LINK_FOTO);

            const menu = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder().setCustomId('ticket_select').setPlaceholder('Escolha o motivo...').addOptions([
                    { label: 'Suporte Geral', value: 'suporte', emoji: '🔧' },
                    { label: 'Reembolso', value: 'reembolso', emoji: '💰' },
                    { label: 'Parcerias', value: 'parcerias', emoji: '💼' },
                    { label: 'Vagas de Mediador', value: 'vagas', emoji: '👔' }
                ])
            );
            return await interaction.reply({ embeds: [embed], components: [menu] });
        }

        if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select') {
            await interaction.deferUpdate().catch(() => {});
            const canal = await interaction.guild.channels.create({
                name: `ticket-${interaction.user.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: ['ViewChannel'] },
                    { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] }
                ]
            });

            const embedTicket = new EmbedBuilder()
                .setTitle("Ticket de Suporte")
                .setDescription(`Bem-vindo, ${interaction.user.username}.\n\nUm atendente virá em breve. Por favor, detalhe seu problema aqui para agilizar o atendimento.`)
                .setColor(0x000000)
                .setThumbnail(LINK_FOTO);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('resolver_ticket').setLabel('Resolvido').setStyle(ButtonStyle.Secondary)
            );

            await canal.send({ embeds: [embedTicket], components: [row] });
            
            const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
            if (logChannel) {
                logChannel.send(`📝 **Novo Ticket:** ${canal.toString()} | 👤 ${interaction.user.username}`);
            }
        }

        if (interaction.isButton() && interaction.customId === 'resolver_ticket') {
            await interaction.reply({ content: "Encerrando ticket...", ephemeral: true });
            setTimeout(() => interaction.channel.delete().catch(() => {}), 2000);
        }
    } catch (e) { console.error(e); }
});

client.login(TOKEN);
