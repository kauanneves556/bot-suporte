const { Client, GatewayIntentBits, ActionRowBuilder, EmbedBuilder, ChannelType, REST, Routes, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const http = require('http');

const TOKEN = process.env.TOKEN;
const CARGO_ID = '1512598694166528210';
const LOGS_ID = '1512516747390091496';
const VOICE_ID = '1512999528217710693';
const LINK_FOTO = "https://cdn.discordapp.com/attachments/1512591953529803014/1512868218329632828/f44b70f9-c9a5-4c47-b6e7-15b08d369a1c.png";

http.createServer((req, res) => { res.writeHead(200); res.end('Bot online!'); }).listen(3000);

let estoque = { vendas: 36, ticket: 12, boasvindas: 53, complect: 10 };
let filasMobile = ["0,30", "0,50", "1,00", "2,00", "3,00", "5,00", "10,00", "20,00", "50,00", "100,00"];
let filaData = new Map();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates] });

client.once('ready', async () => {
    const channel = client.channels.cache.get(VOICE_ID);
    if (channel) joinVoiceChannel({ channelId: channel.id, guildId: channel.guild.id, adapterCreator: channel.guild.voiceAdapterCreator, selfDeaf: true });
    
    const commands = [
        { name: 'setup-loja', description: 'Envia painel loja' },
        { name: 'setup-ticket', description: 'Envia painel ticket' },
        { name: 'mob1v1', description: 'Envia painéis de fila 1v1' },
        { name: 'repor', description: 'Repor estoque', options: [{ name: 'item', type: 3, required: true }, { name: 'quantidade', type: 4, required: true }] }
    ];
    await new REST({ version: '10' }).setToken(TOKEN).put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('✅ Bot Reduto Online e pronto!');
});

client.on('interactionCreate', async interaction => {
    // COMANDOS SLASH
    if (interaction.isChatInputCommand()) {
        if (!interaction.member.roles.cache.has(CARGO_ID)) return interaction.reply({ content: '❌ Sem permissão.', ephemeral: true });

        if (interaction.commandName === 'mob1v1') {
            for (const v of filasMobile) {
                const embed = new EmbedBuilder().setTitle("🎮 FILA 1V1 MOBILE").setColor('#000000').setThumbnail(LINK_FOTO)
                    .setDescription(`**Valor:** R$ ${v}\n\n👤 **Jogadores na fila:**\nNenhum jogador.`);
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`infinito_${v}`).setLabel('Gel Infinito').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId(`normal_${v}`).setLabel('Gel Normal').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId(`sair_${v}`).setLabel('Sair').setStyle(ButtonStyle.Danger)
                );
                await interaction.channel.send({ embeds: [embed], components: [row] });
            }
            return interaction.reply({ content: '✅ Painéis de fila enviados.', ephemeral: true });
        }
        // ... coloque aqui seu código original de setup-loja, setup-ticket e repor ...
    }

    // LOGICA DOS BOTÕES
    if (interaction.isButton()) {
        const [acao, valor] = interaction.customId.split('_');
        if (acao === 'infinito' || acao === 'normal') {
            if (!filaData.has(valor)) filaData.set(valor, []);
            let list = filaData.get(valor);
            if (!list.includes(interaction.user.id)) {
                list.push(interaction.user.id);
                filaData.set(valor, list);
                if (list.length === 2) {
                    const canal = await interaction.guild.channels.create({ name: `fila-${acao}-${valor}`, type: ChannelType.GuildText });
                    await canal.send(`✅ Partida fechada! <@${list[0]}> e <@${list[1]}>.`);
                    filaData.set(valor, []);
                    await interaction.reply({ content: `✅ Canal ${canal} criado!`, ephemeral: true });
                } else {
                    await interaction.reply({ content: `✅ Você entrou na fila de Gel ${acao} (R$ ${valor})!`, ephemeral: true });
                }
            }
        } else if (acao === 'sair') {
            let list = filaData.get(valor) || [];
            filaData.set(valor, list.filter(id => id !== interaction.user.id));
            await interaction.reply({ content: '❌ Você saiu da fila.', ephemeral: true });
        }
    }
});

client.login(TOKEN);
