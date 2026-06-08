const { Client, GatewayIntentBits, ActionRowBuilder, EmbedBuilder, ChannelType, REST, Routes, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const http = require('http');

const TOKEN = process.env.TOKEN;
const VOICE_ID = '1512999528217710693';
const LINK_FOTO = "https://cdn.discordapp.com/attachments/1512591953529803014/1512868218329632828/f44b70f9-c9a5-4c47-b6e7-15b08d369a1c.png";

// Mantém o servidor web ligado
http.createServer((req, res) => { res.writeHead(200); res.end('Bot Online'); }).listen(3000);

let filaData = new Map();
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates] });

client.once('ready', async () => {
    const channel = client.channels.cache.get(VOICE_ID);
    if (channel) joinVoiceChannel({ channelId: channel.id, guildId: channel.guild.id, adapterCreator: channel.guild.voiceAdapterCreator, selfDeaf: true });
    
    // Setup dos comandos
    const commands = [
        { name: 'setup-ticket', description: 'Cria o painel de suporte' }
    ];
    await new REST({ version: '10' }).setToken(TOKEN).put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('✅ Bot Reduto Operacional!');
});

client.on('interactionCreate', async interaction => {
    try {
        // COMANDO SETUP-TICKET
        if (interaction.isChatInputCommand() && interaction.commandName === 'setup-ticket') {
            const embed = new EmbedBuilder()
                .setTitle("🛠️ CENTRAL DE ATENDIMENTO | REDUTO")
                .setDescription("Precisa de ajuda ou quer tirar alguma dúvida? Você está no lugar certo!\n\nNossa equipe de mediadores e atendentes está pronta para te auxiliar com qualquer problema ou solicitação.\n\n**📜 REGRAS DO ATENDIMENTO:**\n• Seja educado com os atendentes.\n• Não abra tickets sem necessidade.\n• Descreva seu problema com detalhes.\n\n**🕒 Horário de Funcionamento:** 24 Horas\n\nEscolha o motivo abaixo:")
                .setColor('#000000')
                .setThumbnail(LINK_FOTO)
                .setFooter({ text: "Atendimento Especializado Reduto" });

            const menu = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder().setCustomId('ticket_select').setPlaceholder('Escolha o motivo do contato...').addOptions([
                    { label: 'Suporte Geral', value: 'suporte', description: 'Dúvidas e auxílio técnico', emoji: '🔧' },
                    { label: 'Reembolso', value: 'reembolso', description: 'Problemas com pagamentos', emoji: '💰' },
                    { label: 'Parcerias', value: 'parcerias', description: 'Se deseja ser nosso parceiro', emoji: '💼' }
                ])
            );
            await interaction.reply({ embeds: [embed], components: [menu] });
        }

        // PROCESSAMENTO DO TICKET
        if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select') {
            // A parte crucial: evitar a falha de interação
            await interaction.deferUpdate().catch(() => {});

            const canal = await interaction.guild.channels.create({
                name: `ticket-${interaction.user.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: ['ViewChannel'] },
                    { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] }
                ]
            });

            const embedTicket = new EmbedBuilder()
                .setTitle("✅ TICKET ABERTO")
                .setDescription(`Olá, <@${interaction.user.id}>.\n\nSua solicitação de **${interaction.values[0]}** foi registrada.\nUm de nossos atendentes responderá em breve.`)
                .setColor('#00FF00');

            const botaoResolver = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('resolver_ticket').setLabel('Resolver Ticket').setStyle(ButtonStyle.Success)
            );

            await canal.send({ embeds: [embedTicket], components: [botaoResolver] });
        }

        // BOTAO RESOLVER
        if (interaction.isButton() && interaction.customId === 'resolver_ticket') {
            await interaction.reply("O ticket será encerrado em 5 segundos...");
            setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
        }
    } catch (e) { console.error("Erro na interação:", e); }
});

client.login(TOKEN);
