const { Client, GatewayIntentBits, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, EmbedBuilder, ChannelType, PermissionFlagsBits, ButtonBuilder, ButtonStyle, AttachmentBuilder, REST, Routes } = require('discord.js');

// O TOKEN será pego do ambiente da Render (seguro!)
const TOKEN = process.env.TOKEN; 
const CANAL_LOGS_ID = '1512516747390091496';
const LINK_FOTO = "https://cdn.discordapp.com/attachments/1512591953529803014/1512868218329632828/f44b70f9-c9a5-4c47-b6e7-15b08d369a1c.png";

// Estoque centralizado
let estoque = { vendas: 0, ticket: 0, boasvindas: 0, complect: 0 };

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.once('ready', async () => {
    console.log(`🤖 Bot online e pronto!`);
    
    // Lista completa de comandos
    const commands = [
        { name: 'setup-ticket', description: 'Configura painel de tickets' },
        { name: 'on', description: 'Status' },
        { name: 'menuvendas', description: 'Vitrine Vendas' },
        { name: 'menuticket', description: 'Vitrine Tickets' },
        { name: 'menuboasvindas', description: 'Vitrine Boas-vindas' },
        { name: 'menucomplect', description: 'Vitrine Complect' },
        { name: 'repor', description: 'Repor estoque', options: [
            { name: 'item', type: 3, description: 'vendas, ticket, boasvindas, ou complect', required: true },
            { name: 'quantidade', type: 4, description: 'Quantidade numérica', required: true }
        ]}
    ];

    const rest = new REST({ version: '10' }).setToken(TOKEN);
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
});

client.on('interactionCreate', async interaction => {
    // 1. COMANDOS DE BARRA
    if (interaction.isChatInputCommand()) {
        
        // Vitrines
        const menus = {
            'menuvendas': { titulo: "🛒 Bot de Vendas", preco: "10,00 Mensal" },
            'menuticket': { titulo: "🎟️ Bot de Tickets", preco: "10,00 Mensal" },
            'menuboasvindas': { titulo: "👋 Bot Boas-vindas", preco: "10,00 Mensal" },
            'menucomplect': { titulo: "🤖 Bot Complect", preco: "15,00 Mensal" }
        };

        if (menus[interaction.commandName]) {
            const itemKey = interaction.commandName.replace('menu', '');
            const m = menus[interaction.commandName];
            const embed = new EmbedBuilder()
                .setTitle(m.titulo)
                .setDescription(`**Valor:** ${m.preco}\n**Estoque:** ${estoque[itemKey]}`)
                .setColor(0xFF0000)
                .setImage(LINK_FOTO);
            return await interaction.reply({ embeds: [embed] });
        }

        // Repor Estoque
        if (interaction.commandName === 'repor') {
            const item = interaction.options.getString('item');
            const qtd = interaction.options.getInteger('quantidade');
            if (estoque.hasOwnProperty(item)) {
                estoque[item] += qtd;
                return await interaction.reply(`✅ Estoque de **${item}** atualizado para **${estoque[item]}**!`);
            }
            return await interaction.reply('❌ Item inválido.');
        }

        // Tickets
        if (interaction.commandName === 'setup-ticket') {
            const embed = new EmbedBuilder().setColor('#0f0f0f').setTitle('⚙️ CENTRAL DE ATENDIMENTO').setThumbnail(LINK_FOTO).setDescription('Selecione uma opção.');
            const menu = new StringSelectMenuBuilder().setCustomId('menu_ticket').setPlaceholder('Escolha').addOptions(
                new StringSelectMenuOptionBuilder().setLabel('Suporte').setValue('suporte'),
                new StringSelectMenuOptionBuilder().setLabel('Reembolso').setValue('reembolso')
            );
            await interaction.reply({ content: 'Painel criado!', ephemeral: true });
            await interaction.channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)] });
        }
    }

    // 2. TICKET LÓGICA (Mantida igual para não quebrar)
    if (interaction.isStringSelectMenu() && interaction.customId === 'menu_ticket') {
        const canal = await interaction.guild.channels.create({ name: `${interaction.values[0]}-${interaction.user.username}`, type: ChannelType.GuildText });
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('reivindicar_ticket').setLabel('Reivindicar').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('fechar_ticket').setLabel('Fechar').setStyle(ButtonStyle.Secondary)
        );
        await canal.send({ content: `Bem-vindo ${interaction.user}`, components: [row] });
        await interaction.reply({ content: `✅ Canal: ${canal}`, ephemeral: true });
    }

    if (interaction.isButton()) {
        if (interaction.customId === 'fechar_ticket') {
            await interaction.reply('🔒 Encerrando...');
            setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
        }
    }
});

client.login(TOKEN);
