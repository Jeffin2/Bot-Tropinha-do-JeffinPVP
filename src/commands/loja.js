const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const KC = "<:PVPCoin:1515754712245211318>";

module.exports = {

data: new SlashCommandBuilder()
    .setName("loja")
    .setDescription("Loja de itens"),

async execute(interaction) {

    return interaction.reply({
        embeds: [
            new EmbedBuilder()
                .setColor("Purple")
                .setTitle("🛒 Loja da Tropinha")
                .setDescription(
                    `🎭 VIP - 10000 ${KC}\n` +
                    `🎨 Cor especial - 2000 ${KC}\n` +
                    `📦 Caixa misteriosa - 1000 ${KC}`
                )
        ]
    });
}
};