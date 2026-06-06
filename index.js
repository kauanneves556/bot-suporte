const { Client, GatewayIntentBits, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, EmbedBuilder, ChannelType, PermissionFlagsBits, REST, Routes } = require('discord.js');

const TOKEN = process.env.TOKEN;
const LINK_FOTO = "https://cdn.discordapp.com/attachments/1512591953529803014/1512868218329632828/f44b70f9-c9a5-4c47-b6e7-15b08d369a1c.png";

// Estoque centralizado
let estoque = { vendas: 0, ticket: 0, boasvindas: 0, complect: 0 };

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once('ready', async () => {
    const commands = [
        { name: 'menu', description: 'Abrir painel de compras' },
        { name: 'repor', description: 'Repor estoque', options: [
            { name: 'item', type: 3, description: 'vendas, ticket, boasvindas, ou complect', required: true },
            { name: 'quantidade', type: 4, description: 'Quantidade', required: true }
        ]}
    ];
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
});

client.on('interactionCreate', async interaction => {
    
    if (interaction.isChatInputCommand()) {
        // --- COMANDO /MENU ---
        if (interaction.commandName === 'menu') {
            const embed = new EmbedBuilder()
                .setTitle("🛒 LOJA DRINIT")
                .setColor('#0f0f0f') // Cor que você pediu
                .setImage(LINK_FOTO)
                .setDescription(`Selecione um produto abaixo para abrir seu ticket.\n\n` +
                                `🛒 **Bot Vendas:** ${estoque.vendas} unidades\n` +
                                `🎟️ **Bot Tickets:** ${estoque.ticket} unidades\n` +
                                `👋 **Bot Boas-vindas:** ${estoque.boasvindas} unidades\n` +
                                `🤖 **Bot Complect:** ${estoque.complect} unidades`);

            const menu = new StringSelectMenuBuilder()
                .setCustomId('menu_compra')
                .setPlaceholder('Escolha seu produto')
                .addOptions([
                    { label: 'Bot de Vendas', value: 'vendas', emoji: '🛒' },
                    { label: 'Bot de Tickets', value: 'ticket', emoji: '🎟️' },
                    { label: 'Bot Boas-vindas', value: 'boasvindas', emoji: '👋' },
                    { label: 'Bot Complect', value: 'complect', emoji: '🤖' }
                ]);
            await interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)] });
        }

        // --- COMANDO /REPOR ---
        if (interaction.commandName === 'repor') {
            const item = interaction.options.getString('item');
            const qtd = interaction.options.getInteger('quantidade');
            if (estoque.hasOwnProperty(item)) {
                estoque[item] += qtd;
                await interaction.reply(`✅ Estoque de **${item}** atualizado para **${estoque[item]}**!`);
            } else {
                await interaction.reply('❌ Produto não encontrado.');
            }
        }
    }

    // --- LÓGICA DO MENU ---
    if (interaction.isStringSelectMenu() && interaction.customId === 'menu_compra') {
        const produto = interaction.values[0];
        const canal = await interaction.guild.channels.create({
            name: `${produto}-${interaction.user.username}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
            ]
        });
        await canal.send(`✅ Ticket de compra para: **${produto.toUpperCase()}**. Aguarde atendimento.`);
        await interaction.reply({ content: `✅ Canal criado: ${canal}`, ephemeral: true });
    }
});

client.login(TOKEN);
