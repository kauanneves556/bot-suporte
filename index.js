const { Client, GatewayIntentBits, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, EmbedBuilder, ChannelType, PermissionFlagsBits, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');

const TOKEN = process.env.TOKEN;
const CANAL_LOGS_ID = '1512516747390091496'; 

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// --- BLOCO DE PROTEÇÃO CONTRA QUEDAS ---
client.on('error', (err) => {
    console.error('Erro detectado no cliente Discord:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Rejeição não tratada em:', promise, 'motivo:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('Exceção não capturada (erro fatal evitável):', err);
});
// ---------------------------------------

client.once('ready', () => {
    console.log(`🤖 Bot online como ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
    const linkImagem = 'https://media.discordapp.net/attachments/1214332923724832811/1247967917227442226/793f1292-8e72-4b0b-a916-6ead8f50df20.png';

    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'setup-ticket') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({ content: 'Você não tem permissão para usar este comando.', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setColor('#0f0f0f') 
                .setTitle('⚙️ CENTRAL DE ATENDIMENTO | DRINIT SUPORTE')
                .setThumbnail(linkImagem)
                .setDescription(
                    'Caso precise de algum suporte ou tenha alguma dúvida basta abrir um ticket abaixo.\n' +
                    'Selecione a opção do ticket de acordo com a sua necessidade.'
                );

            const menu = new StringSelectMenuBuilder()
                .setCustomId('menu_ticket')
                .setPlaceholder('Clique aqui para escolher uma opção')
                .addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Suporte')
                        .setDescription('Clique aqui caso precise de um suporte.')
                        .setEmoji('🛠️')
                        .setValue('suporte'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Reembolso')
                        .setDescription('Clique aqui caso precise receber um reembolso.')
                        .setEmoji('💰')
                        .setValue('reembolso'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Outros')
                        .setDescription('Clique aqui para tratar de outros assuntos.')
                        .setEmoji('💼')
                        .setValue('outros')
                );

            const row = new ActionRowBuilder().addComponents(menu);

            await interaction.reply({ content: 'Painel com menu configurado!', ephemeral: true });
            await interaction.channel.send({ embeds: [embed], components: [row] });
        }
    }

    if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'menu_ticket') {
            const guild = interaction.guild;
            const tipo = interaction.values[0];
            const nomeCanal = `${tipo}-${interaction.user.username}`.toLowerCase();

            const canalExistente = guild.channels.cache.find(c => c.name === nomeCanal);
            if (canalExistente) {
                return interaction.reply({ content: `⚠️ Você já possui um canal de atendimento aberto em ${canalExistente}!`, ephemeral: true });
            }

            await interaction.deferReply({ ephemeral: true });

            const canal = await guild.channels.create({
                name: nomeCanal,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone.id,
                        deny: [PermissionFlagsBits.ViewChannel],
                    },
                    {
                        id: interaction.user.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles],
                    }
                ],
            });

            let motivoTexto = '';
            if (tipo === 'suporte') motivoTexto = 'Descreva detalhadamente o seu problema técnico ou dúvida para que nossa equipe possa te auxiliar.';
            if (tipo === 'reembolso') motivoTexto = 'Envie o código da transação, e-mail da compra e o motivo do reembolso para prosseguirmos com a sua solicitação.';
            if (tipo === 'outros') motivoTexto = 'Por favor, informe o assunto que deseja tratar com a nossa administração.';

            const embedTicket = new EmbedBuilder()
                .setColor('#1a1a1a')
                .setTitle(`🎯 Atendimento: ${tipo.toUpperCase()}`)
                .setThumbnail(linkImagem)
                .setDescription(
                    `Olá ${interaction.user}, bem-vindo à Drinit Suporte!\n\n` +
                    `${motivoTexto}\n\n` +
                    '__Aguarde o nosso agente.__ Utilize os botões abaixo para gerenciar este atendimento.'
                )
                .setFooter({ text: `ID do Usuário: ${interaction.user.id}` });

            const botaoReivindicar = new ButtonBuilder()
                .setCustomId('reivindicar_ticket')
                .setLabel('Reivindicar')
                .setEmoji('👤')
                .setStyle(ButtonStyle.Primary);

            const botaoFechar = new ButtonBuilder()
                .setCustomId('fechar_ticket')
                .setLabel('Fechar')
                .setEmoji('🔒')
                .setStyle(ButtonStyle.Secondary);

            const row = new ActionRowBuilder().addComponents(botaoReivindicar, botaoFechar);

            await canal.send({ embeds: [embedTicket], components: [row] });
            await interaction.editReply({ content: `✅ Canal de ${tipo} criado com sucesso! Acesse aqui: ${canal}`, ephemeral: true });
        }
    }

    if (interaction.isButton()) {
        if (interaction.customId === 'reivindicar_ticket') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
                return interaction.reply({ content: '❌ Apenas membros da equipe de suporte podem reivindicar este ticket.', ephemeral: true });
            }

            const componentesAtuais = interaction.message.components[0].components;
            const novaRow = new ActionRowBuilder();
            
            componentesAtuais.forEach(componente => {
                const botao = ButtonBuilder.from(componente);
                if (botao.data.custom_id === 'reivindicar_ticket') {
                    botao.setDisabled(true).setLabel('Reivindicado').setEmoji('✅');
                }
                novaRow.addComponents(botao);
            });

            const novoNome = `✓-${interaction.channel.name}`;
            await interaction.channel.setName(novoNome).catch(() => {});

            await interaction.update({ components: [novaRow] });
            await interaction.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#5865F2')
                        .setDescription(`👤 Este ticket agora está sendo atendido por ${interaction.user}.`)
                ]
            });
        }

        if (interaction.customId === 'fechar_ticket') {
            await interaction.reply('🔒 Preparando arquivamento e gerando logs do atendimento...');

            const mensagens = await interaction.channel.messages.fetch({ limit: 100 });
            let logsTexto = `=== LOGS DE ATENDIMENTO - CANAL: ${interaction.channel.name} ===\n\n`;
            
            mensagens.reverse().forEach(msg => {
                logsTexto += `[${msg.createdAt.toLocaleString('pt-BR')}] ${msg.author.tag}: ${msg.content}\n`;
                if (msg.attachments.size > 0) {
                    msg.attachments.forEach(att => {
                        logsTexto += `   [Arquivo Anexo]: ${att.url}\n`;
                    });
                }
            });

            const canalLogs = interaction.guild.channels.cache.get(CANAL_LOGS_ID);
            if (canalLogs) {
                const arquivoLog = new AttachmentBuilder(Buffer.from(logsTexto, 'utf-8'), { name: `log-${interaction.channel.name}.txt` });
                
                const embedLog = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('🗂️ Ticket Encerrado & Arquivado')
                    .addFields(
                        { name: 'Canal', value: `#${interaction.channel.name}`, inline: true },
                        { name: 'Fechado por', value: `${interaction.user.tag}`, inline: true }
                    )
                    .setTimestamp();

                await canalLogs.send({ embeds: [embedLog], files: [arquivoLog] });
            } else {
                console.log("AVISO: Canal de logs não foi encontrado ou o ID está incorreto.");
            }

            await interaction.channel.send('Deletando canal em 5 segundos...');
            setTimeout(() => {
                interaction.channel.delete().catch(err => console.log("Erro ao deletar canal:", err));
            }, 5000);
        }
    }
});

client.login(TOKEN);
