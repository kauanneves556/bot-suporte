const { Client, GatewayIntentBits, ActionRowBuilder, EmbedBuilder, ChannelType, REST, Routes, ButtonBuilder, ButtonStyle } = require('discord.js');
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
    commands.push({ name: 'setup-ticket', description: 'Painel suporte' }, { name: 'setup-loja', description: 'Painel loja' });
    await new REST({ version: '10' }).setToken(TOKEN).put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('✅ Bot Reduto Operacional!');
});

client.on('interactionCreate', async interaction => {
    try {
        // 1. FILTRO PARA MENUS (Tickets)
        if (interaction.isStringSelectMenu()) {
            await interaction.deferUpdate().catch(() => {});
            // IMPORTANTE: Se o seu sistema de ticket original estiver em outro arquivo ou 
            // depender de uma função específica, chame-a aqui. 
            // Exemplo: abrirTicket(interaction);
            return;
        }

        // 2. FILTRO PARA COMANDOS (Filas)
        if (interaction.isChatInputCommand()) {
            const cmd = interaction.commandName;
            if (['mob', 'emu', 'mis'].some(p => cmd.startsWith(p))) {
                const prefixos = { 'mob': 'Mobile', 'emu': 'Emulador', 'mis': 'Mista' };
                const prefixo = prefixos[cmd.substring(0, 3)];
                const modo = cmd.replace('mob', '').replace('emu', '').replace('mis', '');
                const vals = ["100,00", "50,00", "20,00", "10,00", "5,00", "3,00", "2,00", "1,00", "0,50", "0,30"];
                for (const v of vals) {
                    const embed = new EmbedBuilder().setTitle(`🎮 FILA ${prefixo.toUpperCase()} ${modo}`).setColor('#000000').setThumbnail(LINK_FOTO)
                        .setDescription(`**Valor:** R$ ${v}\n\n👤 **Gel Infinito:** Ninguém.\n👤 **Gel Normal:** Ninguém.`);
                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId(`infinito_${v}_${cmd}`).setLabel('Gel Infinito').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId(`normal_${v}_${cmd}`).setLabel('Gel Normal').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId(`sair_${v}_${cmd}`).setLabel('Sair').setStyle(ButtonStyle.Danger)
                    );
                    await interaction.channel.send({ embeds: [embed], components: [row] });
                }
                return interaction.reply({ content: `✅ Painéis ${cmd} criados.`, ephemeral: true });
            }
        }

        // 3. FILTRO PARA BOTÕES (Filas)
        if (interaction.isButton()) {
            const [acao, valor, cmd] = interaction.customId.split('_');
            if (['infinito', 'normal', 'sair'].includes(acao)) {
                await interaction.deferUpdate().catch(() => {});
                // ... lógica de filas ...
                const limites = { "1v1": 2, "2v2": 4, "3v3": 6, "4v4": 8 };
                const modo = cmd.replace('mob', '').replace('emu', '').replace('mis', '');
                const keyInf = `infinito_${valor}_${cmd}`, keyNor = `normal_${valor}_${cmd}`;
                if (!filaData.has(keyInf)) filaData.set(keyInf, []);
                if (!filaData.has(keyNor)) filaData.set(keyNor, []);
                if (acao === 'sair') {
                    filaData.set(keyInf, filaData.get(keyInf).filter(id => id !== interaction.user.id));
                    filaData.set(keyNor, filaData.get(keyNor).filter(id => id !== interaction.user.id));
                } else {
                    const target = (acao === 'infinito') ? keyInf : keyNor;
                    let list = filaData.get(target);
                    if (!list.includes(interaction.user.id)) { list.push(interaction.user.id); filaData.set(target, list); }
                    if (list.length === limites[modo]) {
                        const canal = await interaction.guild.channels.create({ name: `fila-${cmd}-${valor}`, type: ChannelType.GuildText });
                        await canal.send(`✅ Partida fechada! Jogadores: ${list.map(id => `<@${id}>`).join(', ')}`);
                        filaData.set(target, []);
                    }
                }
                const embed = EmbedBuilder.from(interaction.message.embeds[0]).setDescription(`**Valor:** R$ ${valor}\n\n👤 **Gel Infinito:**\n${filaData.get(keyInf).map(id => `<@${id}>`).join('\n') || 'Ninguém.'}\n\n👤 **Gel Normal:**\n${filaData.get(keyNor).map(id => `<@${id}>`).join('\n') || 'Ninguém.'}`);
                await interaction.editReply({ embeds: [embed] }).catch(() => {});
            }
        }
    } catch (e) { console.error("Erro:", e); }
});

client.login(TOKEN);
