const { Client, GatewayIntentBits, ActionRowBuilder, EmbedBuilder, ChannelType, REST, Routes, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const http = require('http');

const TOKEN = process.env.TOKEN;
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// Mantém o bot vivo no Render
http.createServer((req, res) => { res.writeHead(200); res.end('Bot Online'); }).listen(process.env.PORT || 3000);

client.once('ready', async () => {
    await new REST({ version: '10' }).setToken(TOKEN).put(Routes.applicationCommands(client.user.id), { 
        body: [{ name: 'setup-ticket', description: 'Cria o painel de suporte' }] 
    });
    console.log('✅ Bot operando!');
});

client.on('interactionCreate', async interaction => {
    try {
        // SETUP DO PAINEL
        if (interaction.isChatInputCommand() && interaction.commandName === 'setup-ticket') {
            const embed = new EmbedBuilder()
                .setTitle("🛠️ CENTRAL DE ATENDIMENTO")
                .setDescription("Escolha o motivo abaixo:")
                .setColor(0x000000);

            const menu = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder().setCustomId('ticket_select').setPlaceholder('Escolha o motivo...').addOptions([
                    { label: 'Suporte', value: 'suporte', emoji: '🔧' },
                    { label: 'Reembolso', value: 'reembolso', emoji: '💰' },
                    { label: 'Parcerias', value: 'parcerias', emoji: '💼' }
                ])
            );
            await interaction.reply({ embeds: [embed], components: [menu] });
        }

        // CRIAÇÃO DO TICKET
        if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select') {
            await interaction.deferUpdate(); // Responde ao Discord IMEDIATAMENTE

            const canal = await interaction.guild.channels.create({
                name: `ticket-${interaction.user.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: ['ViewChannel'] },
                    { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages'] }
                ]
            });

            const embedTicket = new EmbedBuilder()
                .setTitle("✅ TICKET ABERTO")
                .setDescription(`Motivo: ${interaction.values[0]}`)
                .setColor(0x00FF00);

            const botao = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('resolver').setLabel('RESOLVIDO').setStyle(ButtonStyle.Success)
            );

            await canal.send({ embeds: [embedTicket], components: [botao] });
        }

        // DELETAR TICKET
        if (interaction.isButton() && interaction.customId === 'resolver') {
            await interaction.reply("Fechando canal...");
            setTimeout(() => interaction.channel.delete().catch(() => {}), 2000);
        }
    } catch (e) { console.error("Erro:", e); }
});

client.login(TOKEN);
