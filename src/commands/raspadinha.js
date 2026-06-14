const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const db = require("../database/database");

const KC = "<:PVPCoin:1515754712245211318>";

const symbols = [
    "💎",
    "👑",
    "💰",
    "🍒",
    "🍀",
    "💀"
];

module.exports = {

    data: new SlashCommandBuilder()
        .setName("raspadinha")
        .setDescription("Compre uma raspadinha da sorte")
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

        if (bet < 100) {
            return interaction.reply({
                content: `❌ A aposta mínima é **100 ${KC}**.`,
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
            CREATE TABLE IF NOT EXISTS raspadinha_cooldown (
                user_id TEXT PRIMARY KEY,
                last_play INTEGER
            )
        `).run();

        const cooldownData = db.prepare(`
            SELECT *
            FROM raspadinha_cooldown
            WHERE user_id = ?
        `).get(userId);

        const now = Date.now();
        const cooldown = 20000;

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

        // Desconta a aposta primeiro
        db.prepare(`
            UPDATE users
            SET wallet = wallet - ?
            WHERE user_id = ?
        `).run(bet, userId);

        // Gera grade 3x3
        const board = [];

        for (let i = 0; i < 9; i++) {

            board.push(
                symbols[
                    Math.floor(
                        Math.random() * symbols.length
                    )
                ]
            );
        }

        const lines = [

            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],

            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],

            [0, 4, 8],
            [2, 4, 6]
        ];

        let multiplier = 0;
        let winningSymbol = null;

        for (const line of lines) {

            const a = board[line[0]];
            const b = board[line[1]];
            const c = board[line[2]];

            if (a === b && b === c) {

                winningSymbol = a;

                switch (a) {

                    case "💎":
                        multiplier = 10;
                        break;

                    case "👑":
                        multiplier = 5;
                        break;

                    case "💰":
                        multiplier = 3;
                        break; 

                    case "🍒":
                        multiplier = 2;
                        break;

                    case "🍀":
                        multiplier = 1.5;
                        break;

                    default:
                        multiplier = 0;
                }

                break;
            }
        }

        let prize = 0;

        if (multiplier > 0) {

            prize =
                Math.floor(
                    bet * multiplier
                );

            db.prepare(`
                UPDATE users
                SET wallet = wallet + ?
                WHERE user_id = ?
            `).run(prize, userId);
        }

        db.prepare(`
            INSERT OR REPLACE INTO raspadinha_cooldown
            (user_id, last_play)
            VALUES (?, ?)
        `).run(userId, now);

        const boardText =
            `${board[0]} ${board[1]} ${board[2]}\n` +
            `${board[3]} ${board[4]} ${board[5]}\n` +
            `${board[6]} ${board[7]} ${board[8]}`;

        const embed = new EmbedBuilder()
            .setColor(
                multiplier > 0
                    ? "Green"
                    : "Red"
            )
            .setTitle("🎟️ Raspadinha do Hospício")
            .setDescription(boardText)
            .addFields({
                name: "Resultado",
                value:
                    multiplier > 0
                        ? `🎉 Você ganhou **${prize} ${KC}** com ${winningSymbol}${winningSymbol}${winningSymbol}`
                        : `💀 Não houve combinação vencedora.`
            })
            .setFooter({
                text: "Tropinha do JeffinPVP"
            })
            .setTimestamp();

        return interaction.reply({
            embeds: [embed]
        });
    }
};