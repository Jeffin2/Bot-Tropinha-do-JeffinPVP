const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const db = require("../database/database");

// Troque pelo ID real do seu emoji
const KC = "<:PVPCoin:1515754712245211318>";

module.exports = {

    data: new SlashCommandBuilder()
        .setName("saldo")
        .setDescription("Ver saldo de PVPCoins"),

    async execute(interaction) {

        const userId = interaction.user.id;

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

        const embed = new EmbedBuilder()
            .setColor("Gold")
            .setTitle("💰 Banco da Tropinha")
            .setThumbnail(interaction.user.displayAvatarURL())
            .addFields(
                {
                    name: "👛 Carteira",
                    value: `${user.wallet} ${KC}`,
                    inline: true
                },
                {
                    name: "🏦 Banco",
                    value: `${user.bank} ${KC}`,
                    inline: true
                },
                {
                    name: "⭐ Nível",
                    value: `${user.level}`,
                    inline: true
                }
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