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
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates] });

client.once('ready', async () => {
    const channel = client.channels.cache.get(VOICE_ID);
    if (channel) {
        joinVoiceChannel({ channelId: channel.id, guildId: channel.guild.id, adapterCreator: channel.guild.voiceAdapterCreator, selfDeaf: true });
        console.log('🤖 Bot Reduto Online e na Call!');
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

        // --- PAINEL DA LOJA (TURBINADO) ---
        if (interaction.commandName === 'setup-loja') {
            const embed = new EmbedBuilder()
                .setTitle("🛒 LOJA PREMIUM | REDUTO SERVICES")
                .setColor('#0f0f0f')
                .setImage(LINK_FOTO)
                .setDescription(
                    `Bem-vindo à nossa central de vendas automatizada.\n\n` +
                    `📌 **SOBRE NOSSOS PRODUTOS:**\n` +
                    `Produtos otimizados para alta performance e segurança total.\n\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                    `📦 **ESTOQUE DISPONÍVEL:**`
                )
                .addFields(
                    { name: '🛒 Bot de Vendas', value: `\`${estoque.vendas} un.\``, inline: true },
                    { name: '🎟️ Bot de Tickets', value: `\`${estoque.ticket} un.\``, inline: true },
                    { name: '👋 Boas-vindas', value: `\`${estoque.boasvindas} un.\``, inline: true },
                    { name: '🤖 Bot Complect', value: `\`${estoque.complect} un.\``, inline: true },
                    { name: '━━━━━━━━━━━━━━━━━━━━━━━━━━', value: ' ' },
                    { name: '✨ VANTAGENS:', value: `✅ Entrega Automática\n🛡️ Segurança Total\n🚀 Hospedagem 24/7` },
                    { name: '━━━━━━━━━━━━━━━━━━━━━━━━━━', value: ' ' }
                )
                .setFooter({ text: 'Reduto Services - Entrega Automática', iconURL: interaction.guild.iconURL() });

            const menu = new StringSelectMenuBuilder().setCustomId('menu_compra').setPlaceholder('Selecione o produto').addOptions([
                { label: 'Bot de Vendas', value: 'vendas', emoji: '🛒' },
                { label: 'Bot de Tickets', value: 'ticket', emoji: '🎟️' },
                { label: 'Bot Boas-vindas', value: 'boasvindas', emoji: '👋' },
                { label: 'Bot Complect', value: 'complect', emoji: '🤖' }
            ]);

            await interaction.channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)] });
            await interaction.reply({ content: '✅ Painel loja enviado!', ephemeral: true });
        }

        // --- PAINEL DE SUPORTE (TURBINADO E GIGRANTE) ---
        if (interaction.commandName === 'setup-ticket') {
            const embed = new EmbedBuilder()
                .setTitle("🔧 CENTRAL DE ATENDIMENTO | REDUTO")
                .setColor('#0f0f0f')
                .setThumbnail(interaction.guild.iconURL())
                .setDescription(
                    `Precisa de ajuda ou quer tirar alguma dúvida? Você está no lugar certo!\n\n` +
                    `Nossa equipe de mediadores e atendentes está pronta para te auxiliar com qualquer problema ou solicitação.\n\n` +
                    `📜 **REGRAS DO ATENDIMENTO:**\n` +
                    `• Seja educado com os atendentes.\n` +
                    `• Não abra tickets sem necessidade (sujeito a ban).\n` +
                    `• Descreva seu problema com o máximo de detalhes.\n\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━━━━━`
                )
                .addFields(
                    { name: '⏰ Horário de Funcionamento', value: `\`Segunda a Domingo - 24 Horas\``, inline: false },
                    { 
                        name: '📂 CATEGORIAS DISPONÍVEIS:', 
                        value: `🔧 **Suporte Geral:** Dúvidas e auxílio técnico.\n` +
                               `💰 **Reembolsos:** Problemas com pagamentos.\n` +
                               `💼 **Parcerias:** Se deseja ser nosso parceiro.\n` +
                               `⚠️ **Denúncias:** Reporte de jogadores ou mediadores.`
                    },
                    { name: '━━━━━━━━━━━━━━━━━━━━━━━━━━', value: 'Escolha abaixo o motivo do seu contato para abrir um chat privado.' }
                )
                .setFooter({ text: 'Reduto - Atendimento Especializado', iconURL: interaction.guild.iconURL() });

            const menu = new StringSelectMenuBuilder()
                .setCustomId('menu_suporte')
                .setPlaceholder('Escolha o motivo do contato...')
                .addOptions([
                    { label: 'Suporte Geral', description: 'Dúvidas e problemas técnicos', value: 'suporte', emoji: '🔧' },
                    { label: 'Reembolso', description: 'Problemas com compras ou pix', value: 'reembolso', emoji: '💰' },
                    { label: 'Outros / Parcerias', description: 'Assuntos diversos', value: 'outros', emoji: '💼' }
                ]);

            await interaction.channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)] });
            await interaction.reply({ content: '✅ Painel de suporte enviado!', ephemeral: true });
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

    // --- INTERNA DO TICKET (PROFISSIONAL) ---
    if (interaction.isStringSelectMenu()) {
        const canal = await interaction.guild.channels.create({ name: `ticket-${interaction.user.username}`, type: ChannelType.GuildText });

        const embedTicket = new EmbedBuilder()
            .setTitle("🛡️ REDUTO | ATENDIMENTO")
            .setColor('#000000')
            .setDescription(`Olá ${interaction.user}, aguarde um mediador para lhe atender.\n\n` +
                            `👤 **Usuário:** ${interaction.user.tag}\n` +
                            `⏳ **Aberto em:** <t:${Math.floor(Date.now() / 1000)}:R>\n\n` +
                            `*Tenha em mãos as provas da aposta ou comprovante PIX.*`)
            .setThumbnail(interaction.guild.iconURL())
            .setFooter({ text: 'Reduto - Sistema de Atendimento' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('close_ticket').setLabel('✅ Resolvido').setStyle(ButtonStyle.Success)
        );
        await canal.send({ content: `${interaction.user} | <@&${CARGO_ID}>`, embeds: [embedTicket], components: [row] });
        await interaction.reply({ content: `✅ Canal criado: ${canal}`, ephemeral: true });
    }

    if (interaction.isButton() && interaction.customId === 'close_ticket') {
        await interaction.reply(`🔒 Finalizando atendimento...`);
        const messages = await interaction.channel.messages.fetch();
        const transcript = messages.reverse().map(m => `[${m.author.tag}]: ${m.content}`).join('\n');
        const logChannel = interaction.guild.channels.cache.get(LOGS_ID);
        if (logChannel) await logChannel.send({ content: `🔒 **Ticket Resolvido**\nAtendente: ${interaction.user.username}`, files: [{ attachment: Buffer.from(transcript), name: `transcript.txt` }] });
        setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
    }
});

client.login(TOKEN);
