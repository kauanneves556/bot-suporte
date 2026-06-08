const { Client, GatewayIntentBits, ActionRowBuilder, EmbedBuilder, ChannelType, REST, Routes, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const http = require('http');

const TOKEN = process.env.TOKEN;
const VOICE_ID = '1512999528217710693';
const LINK_FOTO = "https://cdn.discordapp.com/attachments/1512591953529803014/1512868218329632828/f44b70f9-c9a5-4c47-b6e7-15b08d369a1c.png";

http.createServer((req, res) => { res.writeHead(200); res.end('Bot Online'); }).listen(3000);

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates] });

client.once('ready', async () => {
    const channel = client.channels.cache.get(VOICE_ID);
    if (channel) joinVoiceChannel({ channelId: channel.id, guildId: channel.guild.id, adapterCreator: channel.guild.voiceAdapterCreator, selfDeaf: true });
    
    await new REST({ version: '10' }).setToken(TOKEN).put(Routes.applicationCommands(client.user.id), { 
        body: [{ name: 'setup-ticket', description: 'Cria o painel de suporte' }] 
    });
    console.log('✅ Bot Reduto Operacional!');
});

client.on('interactionCreate', async interaction => {
    try {
        // 1. COMANDO /setup-ticket
        if (interaction.isChatInputCommand() && interaction.commandName === 'setup-ticket') {
            const embed = new EmbedBuilder()
                .setTitle("🛠️ CENTRAL DE ATENDIMENTO | REDUTO")
                .setDescription("Precisa de ajuda? Escolha o motivo do seu contato abaixo e nossa equipe irá te atender.")
                .setColor(0x000000)
                .setThumbnail(LINK_FOTO);

            const menu = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder().setCustomId('ticket_select').setPlaceholder('Escolha o motivo...').addOptions([
                    { label: 'Suporte Geral', value: 'suporte', emoji: '🔧' },
                    { label: 'Reembolso', value: 'reembolso', emoji: '💰' },
                    { label: 'Parcerias', value: 'parcerias', emoji: '💼' }
                ])
            );
            await interaction.reply({ embeds: [embed], components: [menu] });
        }

        // 2. INTERAÇÃO COM O MENU (AQUI ESTÁ O CONSERTO)
        if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select') {
            // Primeiro: responde imediatamente ao Discord
            await interaction.deferUpdate().catch(() => {});

            // Segundo: cria o canal
            const canal = await interaction.guild.channels.create({
                name: `ticket-${interaction.user.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: ['ViewChannel'] },
                    { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages'] }
                ]
            });

            // Terceiro: envia a embed bonitinha com o botão
            const embedTicket = new EmbedBuilder()
                .setTitle("✅ TICKET ABERTO")
                .setDescription(`Olá, <@${interaction.user.id}>.\n\nMotivo: **${interaction.values[0]}**\n\nAguarde um atendente.`)
                .setColor(0x00FF00);

            const botao = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('resolver_ticket').setLabel('RESOLVIDO').setStyle(ButtonStyle.Success)
            );

            await canal.send({ embeds: [embedTicket], components: [botao] });
        }

        // 3. BOTAO RESOLVER
        if (interaction.isButton() && interaction.customId === 'resolver_ticket') {
            await interaction.reply("Encerrando ticket...");
            setTimeout(() => interaction.channel.delete().catch(() => {}), 2000);
        }
    } catch (e) { console.error(e); }
});

client.login(TOKEN);
