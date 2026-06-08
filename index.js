const { Client, GatewayIntentBits, ActionRowBuilder, EmbedBuilder, ChannelType, REST, Routes, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const http = require('http');

const TOKEN = process.env.TOKEN;
const VOICE_ID = '1512999528217710693';
const LINK_FOTO = "https://cdn.discordapp.com/attachments/1512591953529803014/1512868218329632828/f44b70f9-c9a5-4c47-b6e7-15b08d369a1c.png";

http.createServer((req, res) => { res.writeHead(200); res.end('Bot Online'); }).listen(3000);

let filaData = new Map();
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates] });

client.once('ready', async () => {
    const channel = client.channels.cache.get(VOICE_ID);
    if (channel) joinVoiceChannel({ channelId: channel.id, guildId: channel.guild.id, adapterCreator: channel.guild.voiceAdapterCreator, selfDeaf: true });
    
    const cmds = ["mob1v1", "mob2v2", "mob3v3", "mob4v4", "emu1v1", "emu2v2", "emu3v3", "emu4v4", "mis2v2", "mis3v3", "mis4v4"];
    const commands = cmds.map(name => ({ name, description: `Fila ${name}` }));
    commands.push({ name: 'setup-ticket', description: 'Painel suporte' });
    
    await new REST({ version: '10' }).setToken(TOKEN).put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('✅ Bot Reduto Operacional!');
});

client.on('interactionCreate', async interaction => {
    try {
        // 1. COMANDOS (SETUP E FILAS)
        if (interaction.isChatInputCommand()) {
            if (interaction.commandName === 'setup-ticket') {
                const embed = new EmbedBuilder().setTitle("CENTRAL DE ATENDIMENTO | REDUTO").setDescription("Escolha abaixo o motivo do seu contato para abrir um chat privado.").setColor('#000000').setThumbnail(LINK_FOTO);
                const menu = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder().setCustomId('ticket_select').setPlaceholder('Escolha o motivo do contato...').addOptions([
                        { label: 'Suporte Geral', value: 'suporte', emoji: '🔧' },
                        { label: 'Reembolso', value: 'reembolso', emoji: '💰' },
                        { label: 'Parcerias', value: 'parcerias', emoji: '💼' }
                    ])
                );
                await interaction.reply({ embeds: [embed], components: [menu] });
            } else {
                // Lógica de criação de fila (a mesma que já funcionava)
                const cmd = interaction.commandName;
                const modo = cmd.replace('mob', '').replace('emu', '').replace('mis', '');
                const vals = ["100,00", "50,00", "1,00"]; // Adicione os outros valores conforme necessário
                for (const v of vals) {
                    const embed = new EmbedBuilder().setTitle(`🎮 FILA ${cmd.toUpperCase()}`).setDescription(`**Valor:** R$ ${v}\n\n👤 **Gel Infinito:** Ninguém.\n👤 **Gel Normal:** Ninguém.`).setColor('#000000');
                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId(`infinito_${v}_${cmd}`).setLabel('Gel Infinito').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId(`normal_${v}_${cmd}`).setLabel('Gel Normal').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId(`sair_${v}_${cmd}`).setLabel('Sair').setStyle(ButtonStyle.Danger)
                    );
                    await interaction.channel.send({ embeds: [embed], components: [row] });
                }
                await interaction.reply({ content: 'Painéis criados.', ephemeral: true });
            }
        }

        // 2. TICKETS (SELECT MENU)
        if (interaction.isStringSelectMenu()) {
            await interaction.deferUpdate().catch(() => {});
            const canal = await interaction.guild.channels.create({
                name: `ticket-${interaction.user.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [{ id: interaction.guild.id, deny: ['ViewChannel'] }, { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages'] }]
            });
            const embedTicket = new EmbedBuilder().setTitle("✅ Ticket Aberto").setDescription(`Ticket aberto por <@${interaction.user.id}>. Motivo: **${interaction.values[0]}**`).setColor('#00FF00');
            await canal.send({ embeds: [embedTicket] });
        }

        // 3. BOTÕES (FILAS)
        if (interaction.isButton()) {
            await interaction.deferUpdate().catch(() => {});
            const [acao, valor, cmd] = interaction.customId.split('_');
            // ... (Lógica de atualizar o embed da fila aqui) ...
        }
    } catch (e) { console.error(e); }
});

client.login(TOKEN);
