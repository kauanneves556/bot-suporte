const { Client, GatewayIntentBits, ActionRowBuilder, EmbedBuilder, ChannelType, REST, Routes, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const transcript = require('discord-html-transcripts');
const http = require('http');

const TOKEN = process.env.TOKEN;
const VOICE_ID = '1512999528217710693';
const LOG_CHANNEL_ID = '1512516747390091496';
const LINK_FOTO = "https://cdn.discordapp.com/attachments/1512591953529803014/1512868218329632828/f44b70f9-c9a5-4c47-b6e7-15b08d369a1c.png";

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates] });

http.createServer((req, res) => { res.writeHead(200); res.end('Bot Online'); }).listen(3000);

client.once('ready', async () => {
    const channel = client.channels.cache.get(VOICE_ID);
    if (channel) joinVoiceChannel({ channelId: channel.id, guildId: channel.guild.id, adapterCreator: channel.guild.voiceAdapterCreator, selfDeaf: true });
});

client.on('interactionCreate', async interaction => {
    try {
        if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select') {
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
                .setTitle("🛠️ CENTRAL DE ATENDIMENTO | REDUTO")
                .setDescription(`Bem-vindo, <@${interaction.user.id}>!\n\n**Motivo:** ${interaction.values[0]}\n\nNossa equipe já foi notificada e em breve um atendente assumirá o seu chamado.`)
                .setColor(0x000000)
                .setThumbnail(LINK_FOTO);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('resolver_ticket').setLabel('Resolvido').setStyle(ButtonStyle.Secondary)
            );

            await canal.send({ embeds: [embedTicket], components: [row] });

            const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
            if (logChannel) {
                logChannel.send({
                    embeds: [new EmbedBuilder()
                        .setTitle("📝 Novo Ticket Criado")
                        .setColor(0x000000)
                        .addFields(
                            { name: "👤 Autor", value: `${interaction.user.tag}`, inline: true },
                            { name: "📂 Canal", value: `${canal.name}`, inline: true },
                            { name: "📌 Motivo", value: `${interaction.values[0]}`, inline: false }
                        )]
                });
            }
        }

        if (interaction.isButton() && interaction.customId === 'resolver_ticket') {
            await interaction.reply({ content: "Finalizando...", ephemeral: true });
            
            const attachment = await transcript.createTranscript(interaction.channel);
            const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
            
            if (logChannel) {
                await logChannel.send({ 
                    embeds: [new EmbedBuilder()
                        .setTitle("🔒 Ticket Finalizado")
                        .setColor(0x000000)
                        .addFields(
                            { name: "👤 Autor Original", value: `${interaction.channel.name.replace('ticket-', '')}`, inline: true },
                            { name: "✅ Fechado por", value: `${interaction.user.tag}`, inline: true }
                        )
                        .setTimestamp()],
                    files: [attachment] 
                });
            }
            setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
        }
    } catch (e) { console.error(e); }
});

client.login(TOKEN);
