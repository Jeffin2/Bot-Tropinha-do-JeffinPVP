const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const db = require("../database/database");

const KC = "<:PVPCoin:1515754712245211318>";

module.exports = {

    data: new SlashCommandBuilder()
        .setName("sacar")
        .setDescription("Sacar PVPCoins do banco")
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

            return interaction.reply({
                content: "❌ Você não possui conta bancária.",
                ephemeral: true
            });
        }

        let valor;

        if (quantidade === "tudo") {

            valor = user.bank;

        } else {

            valor = parseInt(quantidade);

            if (isNaN(valor) || valor <= 0) {

                return interaction.reply({
                    content: "❌ Informe uma quantidade válida.",
                    ephemeral: true
                });
            }
        }

        if (valor > user.bank) {

            return interaction.reply({
                content: "❌ Você não possui essa quantidade no banco.",
                ephemeral: true
            });
        }

        if (valor <= 0) {

            return interaction.reply({
                content: "❌ Seu banco está vazio.",
                ephemeral: true
            });
        }

        db.prepare(`
            UPDATE users
            SET
                wallet = wallet + ?,
                bank = bank - ?
            WHERE user_id = ?
        `).run(valor, valor, userId);

        const embed = new EmbedBuilder()
            .setColor("Blue")
            .setTitle("💰 Saque realizado")
            .setDescription(
                `💸 Sacado: **${valor} ${KC}**`
            )
            .setFooter({
                text: "Tropinha do JeffinPVP"
            })
            .setTimestamp();

        return interaction.reply({
            embeds: [embed]
        });
    }
};