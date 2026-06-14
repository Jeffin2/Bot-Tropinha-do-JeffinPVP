const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const db = require("../database/database");

module.exports = {

data: new SlashCommandBuilder()
    .setName("inventario")
    .setDescription("Veja seus itens"),

async execute(interaction) {

    const userId = interaction.user.id;

    const user = db.prepare(`SELECT * FROM users WHERE user_id = ?`).get(userId);

    return interaction.reply({
        embeds: [
            new EmbedBuilder()
                .setColor("Grey")
                .setTitle("🎒 Inventário")
                .setDescription("Sistema em desenvolvimento...")
        ]
    });
}
};