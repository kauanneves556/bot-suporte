const { Client, GatewayIntentBits, ActionRowBuilder, EmbedBuilder, ChannelType, REST, Routes, ButtonBuilder, ButtonStyle } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const http = require('http');

const TOKEN = process.env.TOKEN;
const CARGO_ID = '1512598694166528210';
const LINK_FOTO = "https://cdn.discordapp.com/attachments/1512591953529803014/1512868218329632828/f44b70f9-c9a5-4c47-b6e7-15b08d369a1c.png";

http.createServer((req, res) => { res.writeHead(200); res.end('Bot Online'); }).listen(3000);

// Armazena filas separadas: filaData.get('infinito-0,30') = [ids...]
let filaData = new Map(); 

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once('ready', async () => {
    const commands = [{ name: 'mob1v1', description: 'Envia painéis de fila 1v1' }];
    await new REST({ version: '10' }).setToken(TOKEN).put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('✅ Bot Reduto Online!');
});

client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand() && interaction.commandName === 'mob1v1') {
        const vals = ["100,00", "50,00", "20,00", "10,00", "5,00", "3,00", "2,00", "1,00", "0,50", "0,30"];
        for (const v of vals) {
            const embed = new EmbedBuilder().setTitle("🎮 FILA 1V1 MOBILE").setColor('#000000').setThumbnail(LINK_FOTO)
                .setDescription(`**Valor:** R$ ${v}\n\n👤 **Fila Gel Infinito:**\nNinguém.\n\n👤 **Fila Gel Normal:**\nNinguém.`);
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`infinito_${v}`).setLabel('Gel Infinito').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId(`normal_${v}`).setLabel('Gel Normal').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId(`sair_${v}`).setLabel('Sair').setStyle(ButtonStyle.Danger)
            );
            await interaction.channel.send({ embeds: [embed], components: [row] });
        }
        return interaction.reply({ content: '✅ Painéis enviados.', ephemeral: true });
    }

    if (interaction.isButton()) {
        const [acao, valor] = interaction.customId.split('_');
        
        // Chaves únicas para cada modo
        const keyInf = `infinito-${valor}`;
        const keyNor = `normal-${valor}`;

        if (!filaData.has(keyInf)) filaData.set(keyInf, []);
        if (!filaData.has(keyNor)) filaData.set(keyNor, []);

        let listInf = filaData.get(keyInf);
        let listNor = filaData.get(keyNor);

        // AÇÃO SAIR (remove de ambos)
        if (acao === 'sair') {
            filaData.set(keyInf, listInf.filter(id => id !== interaction.user.id));
            filaData.set(keyNor, listNor.filter(id => id !== interaction.user.id));
        } else {
            // AÇÃO ENTRAR
            if (acao === 'infinito') {
                if (listInf.includes(interaction.user.id)) return interaction.reply({ content: '❌ Você já está na fila Infinito!', ephemeral: true });
                listInf.push(interaction.user.id);
            } else {
                if (listNor.includes(interaction.user.id)) return interaction.reply({ content: '❌ Você já está na fila Normal!', ephemeral: true });
                listNor.push(interaction.user.id);
            }
        }

        // Tenta criar ticket se chegar a 2
        let listaAtual = acao === 'infinito' ? listInf : listNor;
        if (listaAtual.length === 2 && acao !== 'sair') {
            const canal = await interaction.guild.channels.create({ name: `fila-${acao}-${valor}`, type: ChannelType.GuildText });
            await canal.send(`✅ Partida fechada: <@${listaAtual[0]}> e <@${listaAtual[1]}>`);
            filaData.set(acao === 'infinito' ? keyInf : keyNor, []);
            await interaction.reply({ content: `✅ Ticket criado!`, ephemeral: true });
        } else if (acao !== 'sair') {
            await interaction.reply({ content: `✅ Você entrou na fila de Gel ${acao} (R$ ${valor})!`, ephemeral: true });
        }

        // ATUALIZA O PAINEL
        const embed = EmbedBuilder.from(interaction.message.embeds[0])
            .setDescription(`**Valor:** R$ ${valor}\n\n👤 **Fila Gel Infinito:**\n${filaData.get(keyInf).map(id => `<@${id}>`).join('\n') || 'Ninguém.'}\n\n👤 **Fila Gel Normal:**\n${filaData.get(keyNor).map(id => `<@${id}>`).join('\n') || 'Ninguém.'}`);
        await interaction.message.edit({ embeds: [embed] }).catch(() => {});
    }
});

client.login(TOKEN);
