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
        { name: 'setup-loja', description: 'Envia o painel da loja' },
        { name: 'setup-ticket', description: 'Envia o painel de suporte' },
        { name: 'mob1v1', description: 'Envia 10 painéis de fila 1v1' },
        { name: 'repor', description: 'Repor estoque', options: [{ name: 'item', type: 3, description: 'vendas, ticket, boasvindas, complect', required: true }, { name: 'quantidade', type: 4, description: 'Quantidade', required: true }] }
    ];
    await new REST({ version: '10' }).setToken(TOKEN).put(Routes.applicationCommands(client.user.id), { body: commands });
});

client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        if (!interaction.member.roles.cache.has(CARGO_ID)) return interaction.reply({ content: '❌ Sem permissão.', ephemeral: true });

        // NOVO COMANDO: MOB1V1
        if (interaction.commandName === 'mob1v1') {
            for (const v of filasMobile) {
                const embed = new EmbedBuilder().setTitle("🎮 FILAS MOBILE").setColor('#f1c40f').setThumbnail(LINK_FOTO)
                    .setDescription(`**Modo:** 1v1 Mobile\n**Valor:** R$ ${v}\n\n👤 **Jogadores:** Nenhum.`);
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`gelinfinito_${v}`).setLabel('Gel Infinito').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId(`gelnormal_${v}`).setLabel('Gel Normal').setStyle(ButtonStyle.Secondary)
                );
                await interaction.channel.send({ embeds: [embed], components: [row] });
            }
            return interaction.reply({ content: '✅ Painéis criados.', ephemeral: true });
        }

        // COMANDOS EXISTENTES (LOJA/TICKET)
        if (interaction.commandName === 'setup-loja') { /* SEU CÓDIGO AQUI */ }
        if (interaction.commandName === 'setup-ticket') { /* SEU CÓDIGO AQUI */ }
        if (interaction.commandName === 'repor') { /* SEU CÓDIGO AQUI */ }
    }

    // LOGICA DE BOTOES (FILA E TICKET)
    if (interaction.isButton()) {
        if (interaction.customId.startsWith('gel')) {
            const [tipo, valor] = [interaction.customId.includes('infinito') ? 'infinito' : 'normal', interaction.customId.split('_')[1]];
            const key = `${tipo}-${valor}`;
            if (!filaData.has(key)) filaData.set(key, []);
            let list = filaData.get(key);
            if (!list.includes(interaction.user.id)) {
                list.push(interaction.user.id);
                if (list.length === 2) {
                    const canal = await interaction.guild.channels.create({ name: `fila-${tipo}-${valor}`, type: ChannelType.GuildText });
                    await canal.send(`✅ Partida fechada: <@${list[0]}> vs <@${list[1]}>`);
                    filaData.set(key, []);
                    return interaction.reply({ content: `✅ Canal ${canal} criado!`, ephemeral: true });
                }
                filaData.set(key, list);
                return interaction.reply({ content: `✅ Você entrou na fila de Gel ${tipo} (R$ ${valor})!`, ephemeral: true });
            }
        }
        // ... (resto da lógica de fechar ticket original)
    }
    
    // ... (restante dos menus)
});

client.login(TOKEN);
