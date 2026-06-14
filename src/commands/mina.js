const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const db = require("../database/database");

const KC = "<:PVPCoin:1515754712245211318>";

const size = 5;
const totalTiles = size * size;

function generateBoard(bombsCount) {

    const bombs = new Set();

    while (bombs.size < bombsCount) {
        bombs.add(Math.floor(Math.random() * totalTiles));
    }

    return bombs;
}

function createButtons(revealed, bombs, ended) {

    const rows = [];

    for (let i = 0; i < totalTiles; i++) {

        const rowIndex = Math.floor(i / size);

        if (!rows[rowIndex]) rows[rowIndex] = new ActionRowBuilder();

        let label = "⬜";

        if (revealed.includes(i)) {

            label = bombs.has(i) ? "💣" : "💎";
        }

        rows[rowIndex].addComponents(
            new ButtonBuilder()
                .setCustomId(`mina_${i}`)
                .setLabel(label)
                .setStyle(
                    label === "💣"
                        ? ButtonStyle.Danger
                        : ButtonStyle.Secondary
                )
                .setDisabled(ended || revealed.includes(i))
        );
    }

    // 💰 botão de sacar dentro da última linha
    rows[rows.length - 1].addComponents(
        new ButtonBuilder()
            .setCustomId("mina_stop")
            .setLabel("💰 Sacar")
            .setStyle(ButtonStyle.Success)
            .setDisabled(ended)
    );

    return rows;
}

module.exports = {

    data: new SlashCommandBuilder()
        .setName("mina")
        .setDescription("Jogue Mines")
        .addIntegerOption(opt =>
            opt
                .setName("aposta")
                .setDescription("Quantidade de PVPCoins")
                .setRequired(true)
        ),

    async execute(interaction) {

        const userId = interaction.user.id;
        const bet = interaction.options.getInteger("aposta");

        if (bet <= 0) {
            return interaction.reply({
                content: "❌ aposta invalida",
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
                content: "❌ saldo insuficiente",
                ephemeral: true
            });
        }

        // desconta aposta antes (anti-bug)
        db.prepare(`
        UPDATE users
        SET wallet = wallet - ?
        WHERE user_id = ?
    `).run(bet, userId);

        const bombs = generateBoard(5);

        let revealed = [];
        let multiplier = 1.0;
        let ended = false;

        const embed = new EmbedBuilder()
            .setColor("Blue")
            .setTitle("💣 Mina")
            .setDescription(
                `💰 Aposta: ${bet} ${KC}\n` +
                `💎 Multiplicador: x${multiplier.toFixed(2)}`
            );

        const msg = await interaction.reply({
            embeds: [embed],
            components: createButtons(revealed, bombs, ended),
            fetchReply: true
        });

        const collector = msg.createMessageComponentCollector({
            time: 120000
        });

        collector.on("collect", async button => {

            if (button.user.id !== userId) {
                return button.reply({
                    content: "❌ nao e sua partida",
                    ephemeral: true
                });
            }

            // 💰 BOTÃO SACAR
            if (button.customId === "mina_stop") {

                ended = true;

                const winValue = Math.floor(bet * multiplier);

                db.prepare(`
                UPDATE users
                SET wallet = wallet + ?
                WHERE user_id = ?
            `).run(winValue, userId);

                collector.stop();

                return button.update({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("Gold")
                            .setTitle("💰 Saque realizado")
                            .setDescription(
                                `Você sacou **${winValue} ${KC}**`
                            )
                    ],
                    components: createButtons(revealed, bombs, true)
                });
            }

            const index = parseInt(button.customId.split("_")[1]);

            if (ended || revealed.includes(index)) return;

            revealed.push(index);

            if (bombs.has(index)) {

                ended = true;
                collector.stop();

                return button.update({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("Red")
                            .setTitle("💥 Você explodiu!")
                            .setDescription(
                                `Perdeu ${bet} ${KC}`
                            )
                    ],
                    components: createButtons(revealed, bombs, true)
                });
            }

            multiplier += 0.25;

            const winValue = Math.floor(bet * multiplier);

            return button.update({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Green")
                        .setTitle("💣 Mina")
                        .setDescription(
                            `💰 Aposta: ${bet} ${KC}\n` +
                            `💎 Multiplicador: x${multiplier.toFixed(2)}\n` +
                            `💸 Saque atual: ${winValue} ${KC}`
                        )
                ],
                components: createButtons(revealed, bombs, false)
            });
        });

        collector.on("end", async () => {

            if (ended) return;

            const winValue = Math.floor(bet * multiplier);

            db.prepare(`
            UPDATE users
            SET wallet = wallet + ?
            WHERE user_id = ?
        `).run(winValue, userId);

            try {
                await msg.edit({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("Grey")
                            .setTitle("🏁 Mina finalizada")
                            .setDescription(
                                `💰 Você sacou ${winValue} ${KC}`
                            )
                    ],
                    components: []
                });
            } catch { }
        });
    }
};