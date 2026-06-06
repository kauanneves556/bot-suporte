const { Client, GatewayIntentBits, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ChannelType, PermissionFlagsBits, REST, Routes, ButtonBuilder, ButtonStyle } = require('discord.js');
const http = require('http');

const TOKEN = process.env.TOKEN;
const CARGO_ID = '1512598694166528210'; // ID do seu cargo "Ownner Bots"
const LINK_FOTO = "https://cdn.discordapp.com/attachments/1512591953529803014/1512868218329632828/f44b70f9-c9a5-4c47-b6e7-15b08d369a1c.png";

http.createServer((req, res) => { res.writeHead(200); res.end('Bot online!'); }).listen(3000);

let estoque = { vendas: 36, ticket: 12, boasvindas: 53, complect: 10 };

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once('ready', async () => {
    const commands = [
        { name: 'setup-loja', description: 'Envia o painel fixo' },
        { name: 'repor', description: 'Repor estoque', options: [
            { name: 'item', type: 3, description: 'vendas, ticket, boasvindas, ou complect', required: true },
            { name: 'quantidade', type: 4, description: 'Quantidade', required: true }
        ]}
    ];
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
});

client.on('interactionCreate', async interaction => {
    // COMANDOS DE BARRA
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'repor' && !interaction.member.roles.cache.has(CARGO_ID)) {
            return await interaction.reply({ content: '❌ Apenas Owner Bots pode repor!', ephemeral: true });
        }

        if (interaction.commandName === 'setup-loja') {
            const embed = new EmbedBuilder().setTitle("🛒 LOJA DRINIT").setColor('#0f0f0f').setImage(LINK_FOTO)
                .setDescription(`Selecione um produto:\n\n🛒 Vendas: ${estoque.vendas}\n🎟️ Tickets: ${estoque.ticket}\n👋 Boas-vindas: ${estoque.boasvindas}\n🤖 Complect: ${estoque.complect}`);
            const menu = new StringSelectMenuBuilder().setCustomId('menu_compra').setPlaceholder('Escolha aqui').addOptions([
                { label: 'Bot de Vendas', value: 'vendas', emoji: '🛒' },
                { label: 'Bot de Tickets', value: 'ticket', emoji: '🎟️' },
                { label: 'Bot Boas-vindas', value: 'boasvindas', emoji: '👋' },
                { label: 'Bot Complect', value: 'complect', emoji: '🤖' }
            ]);
            await interaction.channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)] });
            await interaction.reply({ content: '✅ Painel enviado!', ephemeral: true });
        }

        if (interaction.commandName === 'repor') {
            const item = interaction.options.getString('item').toLowerCase().trim();
            const qtd = interaction.options.getInteger('quantidade');
            if (estoque.hasOwnProperty(item)) {
                estoque[item] += qtd;
                await interaction.reply(`✅ Estoque de **${item}** atualizado para **${estoque[item]}**!`);
            } else {
                await interaction.reply(`❌ Produto não encontrado.`);
            }
        }
    }

    // LÓGICA DO MENU E BOTÕES DENTRO DO TICKET
    if (interaction.isStringSelectMenu() && interaction.customId === 'menu_compra') {
        const prod = interaction.values[0];
        const canal = await interaction.guild.channels.create({ name: `${prod}-${interaction.user.username}`, type: ChannelType.GuildText });
        
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('claim_ticket').setLabel('Reivindicar').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('close_ticket').setLabel('Fechar').setStyle(ButtonStyle.Danger)
        );
        
        await canal.send({ content: `✅ Ticket de **${prod.toUpperCase()}** aberto por ${interaction.user}.`, components: [row] });
        await interaction.reply({ content: `✅ Canal criado: ${canal}`, ephemeral: true });
    }

    if (interaction.isButton()) {
        if (interaction.customId === 'claim_ticket') {
            await interaction.reply(`🛠️ Ticket sendo atendido por ${interaction.user}`);
        }
        if (interaction.customId === 'close_ticket') {
            await interaction.reply(`🔒 Fechando canal em 5 segundos...`);
            setTimeout(() => interaction.channel.delete(), 5000);
        }
    }
});

client.login(TOKEN);
