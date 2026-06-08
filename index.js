const { Client, GatewayIntentBits, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ChannelType, REST, Routes, ButtonBuilder, ButtonStyle } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const http = require('http');

const TOKEN = process.env.TOKEN;
const CARGO_ID = '1512598694166528210';
const LOGS_ID = '1512516747390091496';
const VOICE_ID = '1512999528217710693';
const LINK_FOTO = "https://cdn.discordapp.com/attachments/1512591953529803014/1512868218329632828/f44b70f9-c9a5-4c47-b6e7-15b08d369a1c.png";

http.createServer((req, res) => { res.writeHead(200); res.end('Bot online!'); }).listen(3000);

let estoque = { vendas: 36, ticket: 12, boasvindas: 53, complect: 10 };
let filasMobile = [{v:"0,30"}, {v:"0,50"}, {v:"1,00"}, {v:"2,00"}, {v:"3,00"}, {v:"5,00"}, {v:"10,00"}, {v:"20,00"}, {v:"50,00"}, {v:"100,00"}];
let filaData = new Map();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates] });

client.once('ready', async () => {
    const channel = client.channels.cache.get(VOICE_ID);
    if (channel) { joinVoiceChannel({ channelId: channel.id, guildId: channel.guild.id, adapterCreator: channel.guild.voiceAdapterCreator, selfDeaf: true }); }
    
    const commands = [
        { name: 'setup-loja', description: 'Envia o painel da loja' },
        { name: 'setup-ticket', description: 'Envia o painel de suporte' },
        { name: 'mob1v1', description: 'Envia 10 painéis de fila 1v1' },
        { name: 'repor', description: 'Repor estoque', options: [
            { name: 'item', type: 3, description: 'vendas, ticket, boasvindas, ou complect', required: true },
            { name: 'quantidade', type: 4, description: 'Quantidade', required: true }
        ]}
    ];
    await new REST({ version: '10' }).setToken(TOKEN).put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('✅ Bot Reduto Operacional.');
});

client.on('interactionCreate', async interaction => {
    // Comandos Slash
    if (interaction.isChatInputCommand()) {
        if (!interaction.member.roles.cache.has(CARGO_ID)) return await interaction.reply({ content: '❌ Sem permissão.', ephemeral: true });

        if (interaction.commandName === 'mob1v1') {
            for (const f of filasMobile) {
                const embed = new EmbedBuilder().setTitle("🎮 FILA 1V1 MOBILE").setColor('#000000').setThumbnail(LINK_FOTO)
                    .setDescription(`💰 **Valor:** R$ ${f.v}\n\n👤 **Jogadores:**\nNenhum na fila.`);
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`gel_infinito_${f.v}`).setLabel('Gel Infinito').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId(`gel_normal_${f.v}`).setLabel('Gel Normal').setStyle(ButtonStyle.Secondary)
                );
                await interaction.channel.send({ embeds: [embed], components: [row] });
            }
            return await interaction.reply({ content: '✅ 10 Painéis de fila enviados!', ephemeral: true });
        }

        if (interaction.commandName === 'setup-loja') {
            const embed = new EmbedBuilder().setTitle("🛒 LOJA PREMIUM | REDUTO").setColor('#0f0f0f').setImage(LINK_FOTO)
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
        
        if (interaction.commandName === 'repor') {
            const item = interaction.options.getString('item').toLowerCase().trim();
            const qtd = interaction.options.getInteger('quantidade');
            if (estoque.hasOwnProperty(item)) {
                estoque[item] += qtd;
                await interaction.reply(`✅ Estoque de **${item}** atualizado para **${estoque[item]}**!`);
            } else { await interaction.reply(`❌ Produto '${item}' não existe.`); }
        }
    }

    // Interações de Menu (Tickets e Loja)
    if (interaction.isStringSelectMenu()) {
        const canal = await interaction.guild.channels.create({ name: `ticket-${interaction.user.username}`, type: ChannelType.GuildText });
        const embedTicket = new EmbedBuilder()
            .setTitle("🛡️ REDUTO | ATENDIMENTO")
            .setColor('#000000')
            .setDescription(`Olá ${interaction.user}, aguarde um mediador.\n\n👤 **Usuário:** ${interaction.user.tag}\n⏳ **Aberto em:** <t:${Math.floor(Date.now() / 1000)}:R>`)
            .setThumbnail(interaction.guild.iconURL()).setFooter({ text: 'Reduto - Sistema de Atendimento' });
        const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('close_ticket').setLabel('✅ Resolvido').setStyle(ButtonStyle.Success));
        await canal.send({ content: `${interaction.user} | <@&${CARGO_ID}>`, embeds: [embedTicket], components: [row] });
        await interaction.reply({ content: `✅ Canal criado: ${canal}`, ephemeral: true });
    }

    // Interações de Botão (Fila e Fechar)
    if (interaction.isButton()) {
        if (interaction.customId.startsWith('gel_')) {
            const [tipo, valor] = interaction.customId.split('_').slice(1);
            const key = `${valor}-${tipo}`;
            if (!filaData.has(key)) filaData.set(key, []);
            let lista = filaData.get(key);
            if (!lista.includes(interaction.user.id)) {
                lista.push(interaction.user.id);
                if (lista.length === 2) {
                    const canal = await interaction.guild.channels.create({ name: `fila-${tipo}-${valor}`, type: ChannelType.GuildText });
                    await canal.send(`✅ Partida fechada! <@${lista[0]}> e <@${lista[1]}>.`);
                    filaData.set(key, []);
                    return await interaction.reply({ content: `✅ Ticket de ${tipo} R$${valor} criado!`, ephemeral: true });
                }
                filaData.set(key, lista);
                await interaction.reply({ content: `✅ Você entrou na fila de **${tipo}** (R$ ${valor})!`, ephemeral: true });
            }
        } else if (interaction.customId === 'close_ticket') {
            await interaction.reply(`🔒 Finalizando...`);
            const messages = await interaction.channel.messages.fetch();
            const transcript = messages.reverse().map(m => `[${m.author.tag}]: ${m.content}`).join('\n');
            const logChannel = interaction.guild.channels.cache.get(LOGS_ID);
            if (logChannel) await logChannel.send({ content: `🔒 **Ticket Resolvido**`, files: [{ attachment: Buffer.from(transcript), name: `transcript.txt` }] });
            setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
        }
    }
});

client.login(TOKEN);
