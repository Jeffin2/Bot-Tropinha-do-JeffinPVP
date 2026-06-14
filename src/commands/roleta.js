const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const db = require("../database/database");

const KC = "<:PVPCoin:1515754712245211318>";

module.exports = {

    data: new SlashCommandBuilder()
        .setName("roleta")
        .setDescription("Aposte na roleta")
        .addStringOption(option =>
            option
                .setName("cor")
                .setDescription("Escolha uma cor")
                .setRequired(true)
                .addChoices(
                    {
                        name: "🔴 Vermelho",
                        value: "vermelho"
                    },
                    {
                        name: "⚫ Preto",
                        value: "preto"
                    },
                    {
                        name: "🟢 Verde",
                        value: "verde"
                    }
                )
        )
        .addIntegerOption(option =>
            option
                .setName("aposta")
                .setDescription("Quantidade de PVPCoins")
                .setRequired(true)
        ),

    async execute(interaction) {

        const userId = interaction.user.id;

        const color =
            interaction.options.getString("cor");

        const bet =
            interaction.options.getInteger("aposta");

        if (bet <= 0) {

            return interaction.reply({
                content: "❌ Informe uma aposta válida.",
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
            CREATE TABLE IF NOT EXISTS roleta_cooldown (
                user_id TEXT PRIMARY KEY,
                last_play INTEGER
            )
        `).run();

        const cooldownData = db.prepare(`
            SELECT *
            FROM roleta_cooldown
            WHERE user_id = ?
        `).get(userId);

        const now = Date.now();
        const cooldown = 15000;

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

        // Desconta a aposta antes do resultado
        db.prepare(`
            UPDATE users
            SET wallet = wallet - ?
            WHERE user_id = ?
        `).run(bet, userId);

        // Resultado da roleta
        const roll = Math.random() * 100;

        let result;

        if (roll < 4) {

            result = "verde";

        } else if (roll < 52) {

            result = "vermelho";

        } else {

            result = "preto";
        }

        let prize = 0;
        let won = false;

        if (color === result) {

            won = true;

            if (result === "verde") {

                prize = bet * 14;

            } else {

                prize = bet * 2;
            }

            db.prepare(`
                UPDATE users
                SET wallet = wallet + ?
                WHERE user_id = ?
            `).run(prize, userId);
        }

        db.prepare(`
            INSERT OR REPLACE INTO roleta_cooldown
            (user_id, last_play)
            VALUES (?, ?)
        `).run(userId, now);

        const emoji =
            result === "vermelho"
                ? "🔴"
                : result === "preto"
                ? "⚫"
                : "🟢";

        const embed = new EmbedBuilder()
            .setColor(
                won
                    ? "Green"
                    : "Red"
            )
            .setTitle("🎡 Roleta do Hospício")
            .addFields(
                {
                    name: "🎯 Sua aposta",
                    value: color,
                    inline: true
                },
                {
                    name: "🎲 Resultado",
                    value: `${emoji} ${result}`,
                    inline: true
                }
            )
            .setDescription(
                won
                    ? `🎉 Você ganhou **${prize} ${KC}**!`
                    : `💀 Você perdeu **${bet} ${KC}**.`
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