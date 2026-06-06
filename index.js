const { Client, GatewayIntentBits, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ChannelType, PermissionFlagsBits, REST, Routes, ButtonBuilder, ButtonStyle } = require('discord.js');
const http = require('http');

const TOKEN = process.env.TOKEN;
const CARGO_ID = '1512598694166528210'; // ID do cargo que pode repor/usar comandos
const LOGS_ID = '1512516747390091496'; // ID do canal de logs
const LINK_FOTO = "https://cdn.discordapp.com/attachments/1512591953529803014/1512868218329632828/f44b70f9-c9a5-4c47-b6e7-15b08d369a1c.png";

// Servidor para manter a Render ativa
http.createServer((req, res) => { res.writeHead(200); res.end('Bot online!'); }).listen(3000);

let estoque = { vendas: 36, ticket: 12, boasvindas: 53, complect: 10 };

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once('ready', async () => {
    const commands = [
        { name: 'setup-loja', description: 'Envia o painel da loja' },
        { name: 'repor', description: 'Repor estoque', options: [
            { name: 'item', type: 3, description: 'vendas, ticket, boasvindas, ou complect', required: true },
            { name: 'quantidade', type: 4, description: 'Quantidade', required: true }
        ]}
    ];
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('🤖 Bot Drinit online e comandos registrados!');
});

client.on('interactionCreate', async interaction => {
    // COMANDOS DE BARRA
    if (interaction.isChatInputCommand()) {
        // Verifica permissão
        if (!interaction.member.roles.cache.has(CARGO_ID)) {
            return await interaction.reply({ content: '❌ Você não tem permissão (Cargo Owner Bots).', ephemeral: true });
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
                await interaction.reply(`❌ Produto '${item}' não existe.`);
            }
        }
    }

    // LÓGICA DO MENU DE COMPRA
    if (interaction.isStringSelectMenu() && interaction.customId === 'menu_compra') {
        const prod = interaction.values[0];
        const canal = await interaction.guild.channels.create({ name: `${prod}-${interaction.user.username}`, type: ChannelType.GuildText });
        
        const logChannel = interaction.guild.channels.cache.get(LOGS_ID);
        if (logChannel) logChannel.send(`🎟️ **Novo Ticket** | Produto: ${prod} | Usuário: ${interaction.user}`);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('claim_ticket').setLabel('Reivindicar').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('close_ticket').setLabel('Fechar').setStyle(ButtonStyle.Danger)
        );
        await canal.send({ content: `✅ Ticket de **${prod.toUpperCase()}** aberto por ${interaction.user}.`, components: [row] });
        await interaction.reply({ content: `✅ Canal criado: ${canal}`, ephemeral: true });
    }

    // LÓGICA DOS BOTÕES
    if (interaction.isButton()) {
        if (interaction.customId === 'claim_ticket') {
            await interaction.reply(`🛠️ Atendimento assumido por ${interaction.user}`);
        }
        if (interaction.customId === 'close_ticket') {
            const messages = await interaction.channel.messages.fetch();
            const transcript = messages.reverse().map(m => `[${m.author.tag}]: ${m.content}`).join('\n');
            const logChannel = interaction.guild.channels.cache.get(LOGS_ID);
            
            if (logChannel) {
                await logChannel.send({ 
                    content: `🔒 **Ticket Fechado**\nUsuário: ${interaction.user}\nCanal: ${interaction.channel.name}`,
                    files: [{ attachment: Buffer.from(transcript), name: `transcript.txt` }]
                });
            }
            await interaction.reply(`🔒 Fechando canal em 3s...`);
            setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
        }
    }
});

client.login(TOKEN);
