const { Client, GatewayIntentBits, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ChannelType, REST, Routes, ButtonBuilder, ButtonStyle } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const http = require('http');

const TOKEN = process.env.TOKEN;
const CARGO_ID = '1512598694166528210';
const LOGS_ID = '1512516747390091496';
const VOICE_ID = '1512999528217710693'; // ID da call
const LINK_FOTO = "https://cdn.discordapp.com/attachments/1512591953529803014/1512868218329632828/f44b70f9-c9a5-4c47-b6e7-15b08d369a1c.png";

http.createServer((req, res) => { res.writeHead(200); res.end('Bot online!'); }).listen(3000);

let estoque = { vendas: 36, ticket: 12, boasvindas: 53, complect: 10 };
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates] });

client.once('ready', async () => {
    // Entrar na call automaticamente
    const channel = client.channels.cache.get(VOICE_ID);
    if (channel) {
        joinVoiceChannel({ channelId: channel.id, guildId: channel.guild.id, adapterCreator: channel.guild.voiceAdapterCreator, selfDeaf: true });
        console.log('🤖 Bot entrou na call e está online!');
    }

    const commands = [
        { name: 'setup-loja', description: 'Envia o painel da loja' },
        { name: 'setup-ticket', description: 'Envia o painel de suporte' },
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
        if (!interaction.member.roles.cache.has(CARGO_ID)) return await interaction.reply({ content: '❌ Sem permissão.', ephemeral: true });

        if (interaction.commandName === 'setup-loja') {
            const embed = new EmbedBuilder().setTitle("🛒 LOJA DRINIT").setColor('#0f0f0f').setImage(LINK_FOTO)
                .setDescription(`Selecione um produto:\n\n🛒 Vendas: ${estoque.vendas}\n🎟️ Tickets: ${estoque.ticket}\n👋 Boas-vindas: ${estoque.boasvindas}\n🤖 Complect: ${estoque.complect}`);
            const menu = new StringSelectMenuBuilder().setCustomId('menu_compra').setPlaceholder('Escolha um produto').addOptions([
                { label: 'Bot de Vendas', value: 'vendas', emoji: '🛒' },
                { label: 'Bot de Tickets', value: 'ticket', emoji: '🎟️' },
                { label: 'Bot Boas-vindas', value: 'boasvindas', emoji: '👋' },
                { label: 'Bot Complect', value: 'complect', emoji: '🤖' }
            ]);
            await interaction.channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)] });
            await interaction.reply({ content: '✅ Painel loja enviado!', ephemeral: true });
        }

        if (interaction.commandName === 'setup-ticket') {
            const embed = new EmbedBuilder().setTitle("🔧 CENTRAL DE SUPORTE").setColor('#0f0f0f').setDescription("Selecione o motivo:");
            const menu = new StringSelectMenuBuilder().setCustomId('menu_suporte').setPlaceholder('Escolha o motivo').addOptions([
                { label: 'Suporte Geral', value: 'suporte', emoji: '🔧' },
                { label: 'Reembolso', value: 'reembolso', emoji: '💰' },
                { label: 'Outros', value: 'outros', emoji: '💼' }
            ]);
            await interaction.channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)] });
            await interaction.reply({ content: '✅ Painel suporte enviado!', ephemeral: true });
        }
    }

    if (interaction.isStringSelectMenu()) {
        const canal = await interaction.guild.channels.create({ name: `${interaction.values[0]}-${interaction.user.username}`, type: ChannelType.GuildText });
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('close_ticket').setLabel('Fechar').setStyle(ButtonStyle.Danger)
        );
        await canal.send({ content: `✅ Ticket de **${interaction.values[0].toUpperCase()}** aberto por ${interaction.user}.`, components: [row] });
        await interaction.reply({ content: `✅ Canal criado: ${canal}`, ephemeral: true });
    }

    if (interaction.isButton() && interaction.customId === 'close_ticket') {
        const messages = await interaction.channel.messages.fetch();
        const transcript = messages.reverse().map(m => `[${m.author.tag}]: ${m.content}`).join('\n');
        const logChannel = interaction.guild.channels.cache.get(LOGS_ID);
        if (logChannel) await logChannel.send({ content: `🔒 **Ticket Fechado**`, files: [{ attachment: Buffer.from(transcript), name: `transcript.txt` }] });
        await interaction.reply(`🔒 Fechando canal...`);
        setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
    }
});

client.login(TOKEN);
