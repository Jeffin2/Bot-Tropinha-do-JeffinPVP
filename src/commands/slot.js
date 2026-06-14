const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const db = require("../database/database");

const KC = "<:PVPCoin:1515754712245211318>";

const symbols = [
    "🍒",
    "🍀",
    "💰",
    "👑",
    "💎",
    "💣"
];

module.exports = {

    data: new SlashCommandBuilder()
        .setName("slot")
        .setDescription("Jogue na máquina caça-níqueis")
        .addIntegerOption(option =>
            option
                .setName("aposta")
                .setDescription("Quantidade de PVPCoins")
                .setRequired(true)
        ),

    async execute(interaction) {

        const userId = interaction.user.id;
        const bet = interaction.options.getInteger("aposta");

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

        // COOL DOWN
        db.prepare(`
            CREATE TABLE IF NOT EXISTS slot_cooldown (
                user_id TEXT PRIMARY KEY,
                last_play INTEGER
            )
        `).run();

        const cooldownData = db.prepare(`
            SELECT *
            FROM slot_cooldown
            WHERE user_id = ?
        `).get(userId);

        const now = Date.now();
        const cooldown = 30000;

        if (
            cooldownData &&
            now - cooldownData.last_play < cooldown
        ) {

            const remaining =
                cooldown - (now - cooldownData.last_play);

            const seconds =
                Math.ceil(remaining / 1000);

            return interaction.reply({
                content: `⏳ Aguarde **${seconds}s** para jogar novamente.`,
                ephemeral: true
            });
        }

        // Desconta primeiro
        db.prepare(`
            UPDATE users
            SET wallet = wallet - ?
            WHERE user_id = ?
        `).run(bet, userId);

        const slot1 =
            symbols[Math.floor(Math.random() * symbols.length)];

        const slot2 =
            symbols[Math.floor(Math.random() * symbols.length)];

        const slot3 =
            symbols[Math.floor(Math.random() * symbols.length)];

        // Casa possui vantagem matemática
        const roll = Math.random() * 100;

        let multiplier = 0;
        let resultText = "💀 Você perdeu.";

        if (roll < 1) {

            multiplier = 10;
            resultText = "💎 JACKPOT LENDÁRIO!";

        } else if (roll < 5) {

            multiplier = 5;
            resultText = "👑 Grande prêmio!";

        } else if (roll < 20) {

            multiplier = 3;
            resultText = "🎉 Trinca vencedora!";

        } else if (roll < 50) {

            multiplier = 1.5;
            resultText = "✨ Pequena vitória!";
        }

        let prize = 0;

        if (multiplier > 0) {

            prize = Math.floor(bet * multiplier);

            db.prepare(`
                UPDATE users
                SET wallet = wallet + ?
                WHERE user_id = ?
            `).run(prize, userId);
        }

        db.prepare(`
            INSERT OR REPLACE INTO slot_cooldown
            (user_id, last_play)
            VALUES (?, ?)
        `).run(userId, now);

        const embed = new EmbedBuilder()
            .setColor(
                multiplier > 0
                    ? "Green"
                    : "Red"
            )
            .setTitle("🎰 Máquina do Hospício")
            .setDescription(
                `${slot1} | ${slot2} | ${slot3}\n\n${resultText}`
            )
            .addFields({
                name: "💰 Resultado",
                value:
                    multiplier > 0
                        ? `+${prize} ${KC}`
                        : `-${bet} ${KC}`
            })
            .setFooter({
                text: "Hospício do Killer"
            })
            .setTimestamp();

        return interaction.reply({
            embeds: [embed]
        });
    }
};