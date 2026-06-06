const { Client, GatewayIntentBits, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ChannelType, PermissionFlagsBits, REST, Routes } = require('discord.js');
const http = require('http');

const TOKEN = process.env.TOKEN;
const LINK_FOTO = "https://cdn.discordapp.com/attachments/1512591953529803014/1512868218329632828/f44b70f9-c9a5-4c47-b6e7-15b08d369a1c.png";

// Servidor para manter a Render viva
http.createServer((req, res) => { res.writeHead(200); res.end('Bot online!'); }).listen(3000);

let estoque = { vendas: 0, ticket: 0, boasvindas: 0, complect: 0 };

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once('ready', async () => {
    console.log('🤖 Bot online!');
    const commands = [
        { name: 'menu', description: 'Painel de compras' },
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
        if (interaction.commandName === 'menu') {
            await interaction.deferReply({ ephemeral: true });
            const embed = new EmbedBuilder()
                .setTitle("🛒 LOJA DRINIT")
                .setColor('#0f0f0f')
                .setImage(LINK_FOTO)
                .setDescription(`Selecione um produto:\n\n🛒 Vendas: ${estoque.vendas}\n🎟️ Tickets: ${estoque.ticket}\n👋 Boas-vindas: ${estoque.boasvindas}\n🤖 Complect: ${estoque.complect}`);
            
            const menu = new StringSelectMenuBuilder().setCustomId('menu_compra').setPlaceholder('Escolha aqui').addOptions([
                { label: 'Bot de Vendas', value: 'vendas', emoji: '🛒' },
                { label: 'Bot de Tickets', value: 'ticket', emoji: '🎟️' },
                { label: 'Bot Boas-vindas', value: 'boasvindas', emoji: '👋' },
                { label: 'Bot Complect', value: 'complect', emoji: '🤖' }
            ]);
            await interaction.editReply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)] });
        }

        if (interaction.commandName === 'repor') {
            const item = interaction.options.getString('item').toLowerCase().trim();
            const qtd = interaction.options.getInteger('quantidade');
            
            if (estoque.hasOwnProperty(item)) {
                estoque[item] += qtd;
                await interaction.reply(`✅ Estoque de **${item}** agora é **${estoque[item]}**!`);
            } else {
                await interaction.reply(`❌ Erro: Produto '${item}' não existe. Use: vendas, ticket, boasvindas ou complect.`);
            }
        }
    }

    if (interaction.isStringSelectMenu() && interaction.customId === 'menu_compra') {
        const prod = interaction.values[0];
        const canal = await interaction.guild.channels.create({ name: `${prod}-${interaction.user.username}`, type: ChannelType.GuildText });
        await canal.send(`✅ Ticket aberto para **${prod.toUpperCase()}**. Usuário: ${interaction.user}`);
        await interaction.reply({ content: `✅ Canal criado: ${canal}`, ephemeral: true });
    }
});

client.login(TOKEN);
