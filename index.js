require("dotenv").config();

const fs = require("fs");
const path = require("path");
const express = require("express");

const {
    Client,
    Collection,
    GatewayIntentBits
} = require("discord.js");

const app = express();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ]
});

client.commands = new Collection();

// =======================
// CARREGAR COMANDOS
// =======================

const commandsPath = path.join(
    __dirname,
    "src",
    "commands"
);

const commandFiles =
    fs.readdirSync(commandsPath);

for (const file of commandFiles) {

    if (!file.endsWith(".js"))
        continue;

    const command = require(
        path.join(commandsPath, file)
    );

    if (
        !command.data ||
        !command.execute
    ) {

        console.log(
            `⚠️ Comando inválido ignorado: ${file}`
        );

        continue;
    }

    client.commands.set(
        command.data.name,
        command
    );

    console.log(
        `✅ Comando carregado: ${command.data.name}`
    );
}

// =======================
// BOT ONLINE
// =======================

client.once("clientReady", () => {

    console.log(
        `🤖 ${client.user.tag} online!`
    );

});

// =======================
// INTERAÇÕES
// =======================

client.on(
    "interactionCreate",
    async interaction => {

        // Botões serão tratados
        // pelos próprios comandos
        if (interaction.isButton()) {
            return;
        }

        if (
            !interaction.isChatInputCommand()
        ) return;

        const command =
            client.commands.get(
                interaction.commandName
            );

        if (!command) return;

        try {

            await command.execute(
                interaction
            );

        } catch (error) {

            console.error(
                `❌ Erro no comando ${interaction.commandName}:`,
                error
            );

            if (
                interaction.replied ||
                interaction.deferred
            ) return;

            await interaction.reply({
                content:
                    "❌ Ocorreu um erro ao executar este comando.",
                ephemeral: true
            });
        }
    }
);

// =======================
// EXPRESS
// =======================

app.get("/", (req, res) => {

    res.send(`
        <html>
            <head>
                <title>Tropinha do JeffinPVP</title>
            </head>

            <body style="
                background:#111;
                color:white;
                text-align:center;
                font-family:Arial;
                padding-top:50px;
            ">
                <h1>🤖 Tropinha do JeffinPVP</h1>

                <h2>
                    ${
                        client.user
                            ? `${client.user.tag} online!`
                            : "Iniciando..."
                    }
                </h2>

                <p>
                    Bot funcionando normalmente.
                </p>
            </body>
        </html>
    `);

});

const PORT =
    process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(
        `🌐 Servidor web iniciado na porta ${PORT}`
    );

});

// =======================
// LOGIN
// =======================

client.login(
    process.env.TOKEN
);

// =======================
// ANTI-CRASH
// =======================

process.on(
    "unhandledRejection",
    error => {

        console.error(
            "❌ Unhandled Rejection:",
            error
        );
    }
);

process.on(
    "uncaughtException",
    error => {

        console.error(
            "❌ Uncaught Exception:",
            error
        );
    }
);