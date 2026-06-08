const { Client, GatewayIntentBits, ActionRowBuilder, EmbedBuilder, ChannelType, REST, Routes, ButtonBuilder, ButtonStyle } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const http = require('http');

const TOKEN = process.env.TOKEN;
const CARGO_ID = '1512598694166528210';
const LOGS_ID = '1512516747390091496';
const VOICE_ID = '1512999528217710693';
const LINK_FOTO = "https://cdn.discordapp.com/attachments/1512591953529803014/1512868218329632828/f44b70f9-c9a5-4c47-b6e7-15b08d369a1c.png";

http.createServer((req, res) => { res.writeHead(200); res.end('Bot Online'); }).listen(3000);

let filaData = new Map();
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates] });

client.once('ready', async () => {
    const channel = client.channels.cache.get(VOICE_ID);
    if (channel) joinVoiceChannel({ channelId: channel.id, guildId: channel.guild.id, adapterCreator: channel.guild.voiceAdapterCreator, selfDeaf: true });
    
    const commands = [
        { name: 'mob1v1', description: 'Envia painéis de fila 1v1' },
        { name: 'setup-ticket', description: 'Envia painel de suporte' }
    ];
    await new REST({ version: '10' }).setToken(TOKEN).put(Routes.applicationCommands(client.user.id), { body: commands });
});

client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'mob1v1') {
            // LISTA INVERTIDA: 100,00 começa em cima, 0,30 termina embaixo
            const vals = ["100,00", "50,00", "20,00", "10,00", "5,00", "3,00", "2,00", "1,00", "0,50", "0,30"];
            for (const v of vals) {
                const embed = new EmbedBuilder().setTitle("🎮 FILA 1V1 MOBILE").setColor('#000000').setThumbnail(LINK_FOTO)
                    .setDescription(`**Valor:** R$ ${v}\n\n👤 **Jogadores:** Nenhum.`);
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`infinito_${v}`).setLabel('Gel Infinito').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId(`normal_${v}`).setLabel('Gel Normal').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId(`sair_${v}`).setLabel('Sair').setStyle(ButtonStyle.Danger)
                );
                await interaction.channel.send({ embeds: [embed], components: [row] });
            }
            return interaction.reply({ content: '✅ Painéis enviados na ordem (100 cima -> 0,30 baixo).', ephemeral: true });
        }
    }

    if (interaction.isButton()) {
        const [acao, valor] = interaction.customId.split('_');
        if (acao === 'sair' || acao === 'infinito' || acao === 'normal') {
            if (!filaData.has(valor)) filaData.set(valor, []);
            let list = filaData.get(valor);

            if (acao === 'sair') {
                list = list.filter(id => id !== interaction.user.id);
            } else {
                if (list.includes(interaction.user.id)) return interaction.reply({ content: '❌ Você já está na fila!', ephemeral: true });
                list.push(interaction.user.id);
            }
            
            filaData.set(valor, list);
            if (list.length === 2 && acao !== 'sair') {
                const canal = await interaction.guild.channels.create({ name: `fila-${valor}`, type: ChannelType.GuildText });
                await canal.send(`✅ Partida fechada: <@${list[0]}> vs <@${list[1]}>`);
                filaData.set(valor, []);
                return interaction.reply({ content: `✅ Fila cheia! Canal: ${canal}`, ephemeral: true });
            }
            
            const embed = EmbedBuilder.from(interaction.message.embeds[0]).setDescription(`**Valor:** R$ ${valor}\n\n👤 **Jogadores:**\n${list.map(id => `<@${id}>`).join('\n') || 'Nenhum.'}`);
            await interaction.update({ embeds: [embed] }).catch(() => {});
        }
    }
});

client.login(TOKEN);
