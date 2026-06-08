const { Client, GatewayIntentBits, ActionRowBuilder, EmbedBuilder, ChannelType, REST, Routes, StringSelectMenuBuilder } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const http = require('http');

const TOKEN = process.env.TOKEN;
const VOICE_ID = '1512999528217710693'; // Seu ID de canal de voz
const LINK_FOTO = "https://cdn.discordapp.com/attachments/1512591953529803014/1512868218329632828/f44b70f9-c9a5-4c47-b6e7-15b08d369a1c.png";

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates] });

http.createServer((req, res) => { res.writeHead(200); res.end('Bot Online'); }).listen(3000);

client.once('ready', async () => {
    // Mantém o bot na call
    const channel = client.channels.cache.get(VOICE_ID);
    if (channel) {
        joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
            selfDeaf: true
        });
    }

    // Registra os comandos (adicione aqui outros comandos que você tinha)
    await new REST({ version: '10' }).setToken(TOKEN).put(Routes.applicationCommands(client.user.id), { 
        body: [{ name: 'setup-ticket', description: 'Cria o painel de suporte' }] 
    });
    console.log('✅ Bot Reduto Operacional e na Call!');
});

client.on('interactionCreate', async interaction => {
    try {
        // SETUP TICKET
        if (interaction.isChatInputCommand() && interaction.commandName === 'setup-ticket') {
            const embed = new EmbedBuilder()
                .setTitle("🛠️ CENTRAL DE ATENDIMENTO | REDUTO")
                .setDescription("Precisa de ajuda ou quer tirar alguma dúvida? Você está no lugar certo!\n\nNossa equipe de mediadores e atendentes está pronta para te auxiliar com qualquer problema ou solicitação.\n\n📜 **REGRAS DO ATENDIMENTO:**\n• Seja educado com os atendentes.\n• Não abra tickets sem necessidade.\n• Descreva seu problema com detalhes.\n\n__________________________\n\n⏰ **Horário de Funcionamento**\n`Segunda a Domingo - 24 Horas`\n\n📁 **CATEGORIAS DISPONÍVEIS:**\n🔧 **Suporte Geral:** Dúvidas e auxílio técnico.\n💰 **Reembolsos:** Problemas com pagamentos.\n💼 **Parcerias:** Se deseja ser nosso parceiro.\n⚠️ **Denúncias:** Reporte de jogadores ou mediadores.\n👔 **Vagas de Mediador:** Candidaturas para a equipe.\n\n__________________________\n\nEscolha abaixo o motivo do seu contato para abrir um chat privado.")
                .setColor(0x000000)
                .setThumbnail(LINK_FOTO)
                .setFooter({ text: "Reduto - Atendimento Especializado" });

            const menu = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder().setCustomId('ticket_select').setPlaceholder('Escolha o motivo do contato...').addOptions([
                    { label: 'Suporte Geral', value: 'suporte', description: 'Dúvidas e problemas técnicos', emoji: '🔧' },
                    { label: 'Reembolso', value: 'reembolso', description: 'Problemas com compras ou pix', emoji: '💰' },
                    { label: 'Outros / Parcerias', value: 'parcerias', description: 'Assuntos diversos', emoji: '💼' },
                    { label: 'Vagas de Mediador', value: 'vagas', description: 'Candidaturas para a equipe', emoji: '👔' }
                ])
            );
            return await interaction.reply({ embeds: [embed], components: [menu] });
        }

        // TICKET SELECIONADO
        if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select') {
            // AQUI ESTÁ A CORREÇÃO DO ERRO DE INTERAÇÃO
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
                .setTitle("✅ Ticket Aberto")
                .setDescription(`Ticket aberto por <@${interaction.user.id}>. Motivo: **${interaction.values[0]}**`)
                .setColor(0x00FF00);

            await canal.send({ embeds: [embedTicket] });
        }
        
        // MANTENHA AQUI SEUS OUTROS COMANDOS DE FILA/ETC QUE VOCÊ JÁ TINHA

    } catch (e) { console.error(e); }
});

client.login(TOKEN);
