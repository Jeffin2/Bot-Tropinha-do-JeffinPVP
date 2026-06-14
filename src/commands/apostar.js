const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const db = require("../database/database");

const KC = "<:PVPCoin:1515754712245211318>";

module.exports = {

data: new SlashCommandBuilder()
    .setName("apostar")
    .setDescription("Cara ou coroa")
    .addStringOption(opt =>
        opt
            .setName("escolha")
            .setDescription("cara ou coroa")
            .setRequired(true)
            .addChoices(
                { name: "cara", value: "cara" },
                { name: "coroa", value: "coroa" }
            )
    )
    .addIntegerOption(opt =>
        opt
            .setName("quantia")
            .setDescription("Quantidade apostada")
            .setRequired(true)
    ),

async execute(interaction) {

    const userId = interaction.user.id;

    const escolha = interaction.options.getString("escolha");
    const amount = interaction.options.getInteger("quantia");

    if (amount <= 0)
        return interaction.reply({
            content: "Valor inválido",
            ephemeral: true
        });

    let user = db.prepare(`
        SELECT *
        FROM users
        WHERE user_id = ?
    `).get(userId);

    if (!user) {

        db.prepare(`
            INSERT INTO users
            (user_id, wallet, bank, xp, level)
            VALUES (?, 0, 0, 0, 1)
        `).run(userId);

        user = db.prepare(`
            SELECT *
            FROM users
            WHERE user_id = ?
        `).get(userId);
    }

    if (!user || user.wallet < amount) {
        return interaction.reply({
            content: "Saldo insuficiente",
            ephemeral: true
        });
    }

    const resultado =
        Math.random() < 0.5 ? "cara" : "coroa";

    let win = escolha === resultado;

    if (win) {

        db.prepare(`
            UPDATE users
            SET wallet = wallet + ?
            WHERE user_id = ?
        `).run(amount, userId);

        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor("Green")
                    .setDescription(
                        `🪙 Deu **${resultado}**!\n` +
                        `🎉 Você ganhou ${amount} ${KC}`
                    )
            ]
        });

    } else {

        db.prepare(`
            UPDATE users
            SET wallet = wallet - ?
            WHERE user_id = ?
        `).run(amount, userId);

        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(
                        `🪙 Deu **${resultado}**!\n` +
                        `💀 Você perdeu ${amount} ${KC}`
                    )
            ]
        });
    }
}
};
//Comentário: O comando "apostar" é um jogo de cara ou coroa onde o usuário pode apostar uma quantia de PVPCoins. O resultado é gerado aleatoriamente e o usuário ganha ou perde a quantia apostada dependendo do resultado. O comando também verifica se o usuário tem saldo suficiente antes de permitir a aposta.