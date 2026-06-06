const { Client, GatewayIntentBits, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, EmbedBuilder, ChannelType, PermissionFlagsBits, ButtonBuilder, ButtonStyle, AttachmentBuilder, REST, Routes } = require('discord.js');

const TOKEN = process.env.TOKEN;
const CANAL_LOGS_ID = '1512516747390091496';
const LINK_FOTO = "https://cdn.discordapp.com/attachments/1512591953529803014/1512868218329632828/f44b70f9-c9a5-4c47-b6e7-15b08d369a1c.png";

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.once('ready', async () => {
    console.log(`🤖 Bot online! Registrando comandos...`);
    const commands = [
        { name: 'on', description: 'Verifica se o bot está online' },
        { name: 'setup-ticket', description: 'Configura o painel de suporte' },
        { name: 'menu', description: 'Painel de compra de produtos' }
    ];
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('✅ Comandos registrados!');
});

client.on('interactionCreate', async interaction => {
    // --- 1. COMANDOS DE BARRA ---
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'on') return await interaction.reply({ content: 'Estou online! 🟢', ephemeral: true });

        if (interaction.commandName === 'setup-ticket') {
            const embed = new EmbedBuilder().setColor('#0f0f0f').setTitle('⚙️ CENTRAL DE SUPORTE').setDescription('Selecione o tipo de suporte:');
            const menu = new StringSelectMenuBuilder().setCustomId('menu_ticket').setPlaceholder('Escolha').addOptions([
                { label: 'Suporte', value: 'suporte', emoji: '🛠️' },
                { label: 'Reembolso', value: 'reembolso', emoji: '💰' }
            ]);
            await interaction.reply({ content: 'Painel criado!', ephemeral: true });
            await interaction.channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)] });
        }

        if (interaction.commandName === 'menu') {
            const embed = new EmbedBuilder().setTitle("🛒 LOJA DRINIT").setDescription("Escolha um produto para abrir o ticket de compra:").setColor(0xFF0000).setImage(LINK_FOTO);
            const menu = new StringSelectMenuBuilder().setCustomId('menu_compra').setPlaceholder('Escolha seu produto').addOptions([
                { label: 'Bot de Vendas', value: 'vendas', emoji: '🛒' },
                { label: 'Bot de Tickets', value: 'ticket', emoji: '🎟️' },
                { label: 'Bot Boas-vindas', value: 'boasvindas', emoji: '👋' },
                { label: 'Bot Complect', value: 'complect', emoji: '🤖' }
            ]);
            await interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)] });
        }
    }

    // --- 2. LÓGICA DE MENUS (Ticket Suporte e Compra) ---
    if (interaction.isStringSelectMenu()) {
        const tipo = interaction.values[0];
        const nomeCanal = `${tipo}-${interaction.user.username}`.toLowerCase();
        
        await interaction.deferReply({ ephemeral: true });
        const canal = await interaction.guild.channels.create({
            name: nomeCanal,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
            ]
        });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('fechar_ticket').setLabel('Fechar Ticket').setStyle(ButtonStyle.Danger)
        );
        await canal.send({ content: `✅ Ticket aberto: **${tipo.toUpperCase()}**\nOlá ${interaction.user}, aguarde atendimento.`, components: [row] });
        await interaction.editReply({ content: `✅ Canal criado: ${canal}` });
    }

    // --- 3. BOTÕES ---
    if (interaction.isButton() && interaction.customId === 'fechar_ticket') {
        await interaction.reply('🔒 Fechando canal...');
        setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    }
});

client.login(TOKEN);
