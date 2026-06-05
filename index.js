const { Client, GatewayIntentBits, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, EmbedBuilder, ChannelType, PermissionFlagsBits, ButtonBuilder, ButtonStyle, AttachmentBuilder, REST, Routes } = require('discord.js');

const TOKEN = process.env.TOKEN;
const CANAL_LOGS_ID = '1512516747390091496'; 

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// --- BLOCO DE REGISTRO DE COMANDOS ---
client.once('ready', async () => {
    console.log(`🤖 Bot online como ${client.user.tag}!`);

    const commands = [
        { name: 'setup-ticket', description: 'Configura o painel de tickets' },
        { name: 'on', description: 'Verifica se o bot está online' }
    ];

    const rest = new REST({ version: '10' }).setToken(TOKEN);

    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('✅ Comandos registrados com sucesso!');
    } catch (error) {
        console.error('Erro ao registrar comandos:', error);
    }
});

// --- BLOCO DE PROTEÇÃO CONTRA QUEDAS ---
client.on('error', (err) => console.error('Erro no cliente Discord:', err));
process.on('unhandledRejection', (reason) => console.error('Rejeição não tratada:', reason));
process.on('uncaughtException', (err) => console.error('Exceção não capturada:', err));

client.on('interactionCreate', async interaction => {
    const linkImagem = 'https://media.discordapp.net/attachments/1214332923724832811/1247967917227442226/793f1292-8e72-4b0b-a916-6ead8f50df20.png';

    // 1. COMANDOS DE BARRA (/)
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'on') {
            return await interaction.reply({ content: 'Estou online e operante! 🟢', ephemeral: true });
        }

        if (interaction.commandName === 'setup-ticket') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({ content: 'Você não tem permissão.', ephemeral: true });
            }
            const embed = new EmbedBuilder()
                .setColor('#0f0f0f') 
                .setTitle('⚙️ CENTRAL DE ATENDIMENTO | DRINIT SUPORTE')
                .setThumbnail(linkImagem)
                .setDescription('Caso precise de algum suporte ou tenha alguma dúvida basta abrir um ticket abaixo.\nSelecione a opção do ticket de acordo com a sua necessidade.');

            const menu = new StringSelectMenuBuilder()
                .setCustomId('menu_ticket')
                .setPlaceholder('Clique aqui para escolher uma opção')
                .addOptions(
                    new StringSelectMenuOptionBuilder().setLabel('Suporte').setDescription('Suporte técnico').setEmoji('🛠️').setValue('suporte'),
                    new StringSelectMenuOptionBuilder().setLabel('Reembolso').setDescription('Solicitar reembolso').setEmoji('💰').setValue('reembolso'),
                    new StringSelectMenuOptionBuilder().setLabel('Outros').setDescription('Outros assuntos').setEmoji('💼').setValue('outros')
                );

            await interaction.reply({ content: 'Painel configurado!', ephemeral: true });
            await interaction.channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)] });
        }
    }

    // 2. MENU DE SELEÇÃO
    if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'menu_ticket') {
            const guild = interaction.guild;
            const tipo = interaction.values[0];
            const nomeCanal = `${tipo}-${interaction.user.username}`.toLowerCase();
            if (guild.channels.cache.find(c => c.name === nomeCanal)) return interaction.reply({ content: '⚠️ Você já possui um canal aberto!', ephemeral: true });

            await interaction.deferReply({ ephemeral: true });
            const canal = await guild.channels.create({
                name: nomeCanal,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] }
                ],
            });

            const embedTicket = new EmbedBuilder().setColor('#1a1a1a').setTitle(`🎯 Atendimento: ${tipo.toUpperCase()}`).setDescription(`Olá ${interaction.user}, bem-vindo à Drinit Suporte! Utilize os botões abaixo.`);
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('reivindicar_ticket').setLabel('Reivindicar').setEmoji('👤').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('fechar_ticket').setLabel('Fechar').setEmoji('🔒').setStyle(ButtonStyle.Secondary)
            );
            await canal.send({ embeds: [embedTicket], components: [row] });
            await interaction.editReply({ content: `✅ Canal criado: ${canal}`, ephemeral: true });
        }
    }

    // 3. BOTÕES
    if (interaction.isButton()) {
        if (interaction.customId === 'reivindicar_ticket') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) return interaction.reply({ content: 'Apenas equipe pode reivindicar.', ephemeral: true });
            const componentes = interaction.message.components[0].components.map(c => ButtonBuilder.from(c).setDisabled(true).setLabel(c.data.custom_id === 'reivindicar_ticket' ? 'Reivindicado' : c.label));
            await interaction.update({ components: [new ActionRowBuilder().addComponents(componentes)] });
            await interaction.channel.setName(`✓-${interaction.channel.name}`);
            await interaction.channel.send({ embeds: [new EmbedBuilder().setColor('#5865F2').setDescription(`👤 Atendido por ${interaction.user}.`)] });
        }

        if (interaction.customId === 'fechar_ticket') {
            await interaction.reply('🔒 Gerando logs...');
            const mensagens = await interaction.channel.messages.fetch({ limit: 100 });
            let logsTexto = mensagens.reverse().map(m => `[${m.createdAt.toLocaleString('pt-BR')}] ${m.author.tag}: ${m.content}`).join('\n');
            const canalLogs = interaction.guild.channels.cache.get(CANAL_LOGS_ID);
            if (canalLogs) await canalLogs.send({ files: [new AttachmentBuilder(Buffer.from(logsTexto), { name: `log-${interaction.channel.name}.txt` })] });
            setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
        }
    }
});

client.login(TOKEN);
