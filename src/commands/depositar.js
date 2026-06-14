const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const db = require("../database/database");

const KC = "<:PVPCoin:1515754712245211318>";

module.exports = {

    data: new SlashCommandBuilder()
        .setName("depositar")
        .setDescription("Depositar PVPCoins no banco")
        .addStringOption(option =>
            option
                .setName("quantidade")
                .setDescription("Quantidade ou 'tudo'")
                .setRequired(true)
        ),

    async execute(interaction) {

        const userId = interaction.user.id;
        const quantidade = interaction.options
            .getString("quantidade")
            .toLowerCase();

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

        let valor;

        if (quantidade === "tudo") {

            valor = user.wallet;

        } else {

            valor = parseInt(quantidade);

            if (isNaN(valor) || valor <= 0) {

                return interaction.reply({
                    content: "❌ Informe uma quantidade válida.",
                    ephemeral: true
                });
            }
        }

        if (valor > user.wallet) {

            return interaction.reply({
                content: "❌ Você não possui essa quantidade na carteira.",
                ephemeral: true
            });
        }

        if (valor <= 0) {

            return interaction.reply({
                content: "❌ Você não possui PVPCoins para depositar.",
                ephemeral: true
            });
        }

        db.prepare(`
            UPDATE users
            SET
                wallet = wallet - ?,
                bank = bank + ?
            WHERE user_id = ?
        `).run(valor, valor, userId);

        const embed = new EmbedBuilder()
            .setColor("Green")
            .setTitle("🏦 Depósito realizado")
            .setDescription(
                `💸 Depositado: **${valor} ${KC}**`
            )
            .setFooter({
                text: "Hospício do Killer"
            })
            .setTimestamp();

        return interaction.reply({
            embeds: [embed]
        });
    }
};