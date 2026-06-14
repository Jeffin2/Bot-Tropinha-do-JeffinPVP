const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const db = require("../database/database");

const KC = "<:PVPCoin:1515754712245211318>";

module.exports = {

    data: new SlashCommandBuilder()
        .setName("dados")
        .setDescription("Jogue dados contra o dealer")
        .addIntegerOption(option =>
            option
                .setName("aposta")
                .setDescription("Quantidade de PVPCoins")
                .setRequired(true)
        ),

    async execute(interaction) {

        const userId = interaction.user.id;

        const bet =
            interaction.options.getInteger("aposta");

        if (bet < 50) {

            return interaction.reply({
                content: `❌ A aposta mínima é **50 ${KC}**.`,
                ephemeral: true
            });
        }

        if (bet > 10000) {

            return interaction.reply({
                content: `❌ A aposta máxima é **10.000 ${KC}**.`,
                ephemeral: true
            });
        }

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

        if (user.wallet < bet) {

            return interaction.reply({
                content: "❌ Você não possui PVPCoins suficientes.",
                ephemeral: true
            });
        }

        db.prepare(`
            CREATE TABLE IF NOT EXISTS dados_cooldown (
                user_id TEXT PRIMARY KEY,
                last_play INTEGER
            )
        `).run();

        const cooldownData = db.prepare(`
            SELECT *
            FROM dados_cooldown
            WHERE user_id = ?
        `).get(userId);

        const now = Date.now();
        const cooldown = 10000;

        if (
            cooldownData &&
            now - cooldownData.last_play < cooldown
        ) {

            const remaining =
                cooldown - (now - cooldownData.last_play);

            const seconds =
                Math.ceil(remaining / 1000);

            return interaction.reply({
                content:
                    `⏳ Aguarde **${seconds}s** para jogar novamente.`,
                ephemeral: true
            });
        }

        // Desconta aposta primeiro
        db.prepare(`
            UPDATE users
            SET wallet = wallet - ?
            WHERE user_id = ?
        `).run(bet, userId);

        const playerRoll =
            Math.floor(Math.random() * 6) + 1;

        const dealerRoll =
            Math.floor(Math.random() * 6) + 1;

        let resultText;
        let prize = 0;
        let color = "Red";

        if (playerRoll > dealerRoll) {

            prize = bet * 2;

            db.prepare(`
                UPDATE users
                SET wallet = wallet + ?
                WHERE user_id = ?
            `).run(prize, userId);

            resultText =
                `🏆 Vitória!\nVocê recebeu **${prize} ${KC}**`;

            color = "Green";

        } else if (playerRoll === dealerRoll) {

            prize = bet;

            db.prepare(`
                UPDATE users
                SET wallet = wallet + ?
                WHERE user_id = ?
            `).run(prize, userId);

            resultText =
                `🤝 Empate!\nSua aposta foi devolvida.`;

            color = "Yellow";

        } else {

            resultText =
                `💀 Derrota!\nVocê perdeu **${bet} ${KC}**`;
        }

        db.prepare(`
            INSERT OR REPLACE INTO dados_cooldown
            (user_id, last_play)
            VALUES (?, ?)
        `).run(userId, now);

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle("🎲 Dados da Tropinha")
            .addFields(
                {
                    name: "🎲 Você",
                    value: `${playerRoll}`,
                    inline: true
                },
                {
                    name: "🎲 Dealer",
                    value: `${dealerRoll}`,
                    inline: true
                }
            )
            .setDescription(resultText)
            .setFooter({
                text: "Tropinha do JeffinPVP"
            })
            .setTimestamp();

        return interaction.reply({
            embeds: [embed]
        });
    }
};