const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const CLIENT_ID = '1512338704306540667';
const TOKEN = 'MTUxMjMzODcwNDMwNjU0MDY2Nw.GriaIt.Hstu1l7S2zLwqQUTJellFDeIOLBgwkIFqGtoac';

const commands = [
    new SlashCommandBuilder()
        .setName('setup-ticket')
        .setDescription('Envia o painel de ticket')
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

async function restaurarComandos() {
    try {
        console.log('Atualizando comandos barra (/) do bot...');
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log('Comandos registrados com sucesso!');
    } catch (error) {
        console.error(error);
    }
}

restaurarComandos();