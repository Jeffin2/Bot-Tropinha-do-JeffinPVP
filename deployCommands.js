require("dotenv").config();

const fs = require("fs");
const path = require("path");

const {
    REST,
    Routes
} = require("discord.js");

// ==========================
// CONFIG
// ==========================
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

// ==========================
// CAMINHO DOS COMANDOS
// ==========================
const commandsPath = path.join(__dirname, "src", "commands");

if (!fs.existsSync(commandsPath)) {
    console.error("❌ Pasta 'src/commands' não encontrada!");
    process.exit(1);
}

// ==========================
// CARREGAR COMANDOS
// ==========================
const commandFiles = fs
    .readdirSync(commandsPath)
    .filter(file => file.endsWith(".js"));

const commands = [];

console.log("🔄 Carregando comandos...");

for (const file of commandFiles) {

    const filePath = path.join(commandsPath, file);

    let command;

    try {
        command = require(filePath);
    } catch (err) {
        console.log(`❌ Erro ao carregar arquivo: ${file}`);
        console.error(err);
        continue;
    }

    // ==========================
    // VALIDAÇÕES IMPORTANTES
    // ==========================
    if (!command?.data) {
        console.log(`❌ SEM DATA: ${file}`);
        continue;
    }

    if (!command.data.name) {
        console.log(`❌ SEM NAME: ${file}`);
        continue;
    }

    if (!command.data.description) {
        console.log(`❌ SEM DESCRIPTION: ${file}`);
        continue;
    }

    if (typeof command.data.name !== "string") {
        console.log(`❌ NAME INVÁLIDO: ${file}`);
        continue;
    }

    if (typeof command.data.description !== "string") {
        console.log(`❌ DESCRIPTION INVÁLIDA: ${file}`);
        continue;
    }

    try {
        commands.push(command.data.toJSON());
        console.log(`✅ Carregado: ${command.data.name}`);
    } catch (err) {
        console.log(`💥 ERRO AO CONVERTER: ${file}`);
        console.error(err);
    }
}

// ==========================
// REGISTRAR NA API DO DISCORD
// ==========================
const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {

    try {

        console.log("🔄 Registrando comandos no Discord...");

        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands }
        );

        console.log(`✅ ${commands.length} comandos registrados com sucesso!`);

    } catch (error) {

        console.error("❌ Erro ao registrar comandos:");
        console.error(error);
    }
})();