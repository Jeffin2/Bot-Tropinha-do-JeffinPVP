const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const db = require("../database/database");

const KC = "<:PVPCoin:1515754712245211318>";

module.exports = {

    data: new SlashCommandBuilder()
        .setName("daily")
        .setDescription("Receba sua recompensa diária"),

    async execute(interaction) {

        const userId = interaction.user.id;

        let user = db.prepare(`
            SELECT * FROM users
            WHERE user_id = ?
        `).get(userId);

        if (!user) {

            db.prepare(`
                INSERT INTO users
                (user_id, wallet, bank, xp, level)
                VALUES (?, 0, 0, 0, 1)
            `).run(userId);

            user = db.prepare(`
                SELECT * FROM users
                WHERE user_id = ?
            `).get(userId);
        }

        db.prepare(`
            CREATE TABLE IF NOT EXISTS daily_rewards (
                user_id TEXT PRIMARY KEY,
                last_claim INTEGER
            )
        `).run();

        const dailyData = db.prepare(`
            SELECT * FROM daily_rewards
            WHERE user_id = ?
        `).get(userId);

        const now = Date.now();
        const cooldown = 24 * 60 * 60 * 1000;

        if (
            dailyData &&
            now - dailyData.last_claim < cooldown
        ) {

            const remaining =
                cooldown - (now - dailyData.last_claim);

            const hours =
                Math.floor(remaining / 3600000);

            const minutes =
                Math.floor((remaining % 3600000) / 60000);

            return interaction.reply({
                content:
                    `⏳ Você já coletou seu daily.\nVolte em **${hours}h ${minutes}m**.`,
                ephemeral: true
            });
        }

        const reward =
            Math.floor(Math.random() * 551) + 100;

        db.prepare(`
            UPDATE users
            SET wallet = wallet + ?
            WHERE user_id = ?
        `).run(reward, userId);

        db.prepare(`
            INSERT OR REPLACE INTO daily_rewards
            (user_id, last_claim)
            VALUES (?, ?)
        `).run(userId, now);

        const embed = new EmbedBuilder()
            .setColor("Gold")
            .setTitle("🎁 Daily Coletado!")
            .setDescription(
                `Você recebeu **${reward} ${KC}**`
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