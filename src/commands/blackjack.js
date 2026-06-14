const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const db = require("../database/database");

const KC = "<:PVPCoin:1515754712245211318>";

const suits = ["♠", "♥", "♦", "♣"];
const values = [
    "A", "2", "3", "4", "5",
    "6", "7", "8", "9", "10",
    "J", "Q", "K"
];

function drawCard() {

    return {
        value: values[Math.floor(Math.random() * values.length)],
        suit: suits[Math.floor(Math.random() * suits.length)]
    };
}

function calculateHand(hand) {

    let total = 0;
    let aces = 0;

    for (const card of hand) {

        if (card.value === "A") {

            total += 11;
            aces++;

        } else if (
            card.value === "J" ||
            card.value === "Q" ||
            card.value === "K"
        ) {

            total += 10;

        } else {

            total += Number(card.value);
        }
    }

    while (total > 21 && aces > 0) {

        total -= 10;
        aces--;
    }

    return total;
}

function handToString(hand) {

    return hand
        .map(card => `${card.value}${card.suit}`)
        .join(" ");
}

module.exports = {

    data: new SlashCommandBuilder()
        .setName("blackjack")
        .setDescription("Jogue Blackjack")
        .addIntegerOption(option =>
            option
                .setName("aposta")
                .setDescription("Quantidade apostada")
                .setRequired(true)
        ),

    async execute(interaction) {

        const userId = interaction.user.id;
        const bet = interaction.options.getInteger("aposta");

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
                content: "❌ Você não possui saldo suficiente.",
                ephemeral: true
            });
        }

        db.prepare(`
            UPDATE users
            SET wallet = wallet - ?
            WHERE user_id = ?
        `).run(bet, userId);

        const playerHand = [
            drawCard(),
            drawCard()
        ];

        const dealerHand = [
            drawCard(),
            drawCard()
        ];

        const playerTotal =
            calculateHand(playerHand);

        const dealerTotal =
            calculateHand(dealerHand);

        if (playerTotal === 21) {

            const prize =
                Math.floor(bet * 1.5);

            db.prepare(`
                UPDATE users
                SET wallet = wallet + ?
                WHERE user_id = ?
            `).run(bet + prize, userId);

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Gold")
                        .setTitle("🃏 BLACKJACK!")
                        .setDescription(
                            `Suas cartas:\n${handToString(playerHand)}\n\n` +
                            `💰 Prêmio: ${prize} ${KC}`
                        )
                ]
            });
        }

        const row =
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("bj_hit")
                        .setLabel("Comprar")
                        .setStyle(ButtonStyle.Primary),

                    new ButtonBuilder()
                        .setCustomId("bj_stand")
                        .setLabel("Parar")
                        .setStyle(ButtonStyle.Success)
                );

        const embed =
            new EmbedBuilder()
                .setColor("Blue")
                .setTitle("🃏 Blackjack")
                .setDescription(
                    `**Suas cartas**\n` +
                    `${handToString(playerHand)}\n` +
                    `Total: **${playerTotal}**\n\n` +

                    `**Dealer**\n` +
                    `${dealerHand[0].value}${dealerHand[0].suit} ?`
                );

        const msg =
            await interaction.reply({
                embeds: [embed],
                components: [row],
                fetchReply: true
            });

        const collector =
            msg.createMessageComponentCollector({
                time: 120000
            });

        collector.on(
            "collect",
            async button => {

                if (
                    button.user.id !== userId
                ) {

                    return button.reply({
                        content:
                            "❌ Apenas quem iniciou a partida pode jogar.",
                        ephemeral: true
                    });
                }

                if (
                    button.customId === "bj_hit"
                ) {

                    playerHand.push(
                        drawCard()
                    );

                    const total =
                        calculateHand(
                            playerHand
                        );

                    if (total > 21) {

                        collector.stop();

                        return button.update({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor("Red")
                                    .setTitle("💀 Você estourou!")
                                    .setDescription(
                                        `${handToString(playerHand)}\n\nTotal: ${total}`
                                    )
                            ],
                            components: []
                        });
                    }

                    return button.update({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("Blue")
                                .setTitle("🃏 Blackjack")
                                .setDescription(
                                    `**Suas cartas**\n` +
                                    `${handToString(playerHand)}\n` +
                                    `Total: **${total}**\n\n` +

                                    `**Dealer**\n` +
                                    `${dealerHand[0].value}${dealerHand[0].suit} ?`
                                )
                        ],
                        components: [row]
                    });
                }

                collector.stop();

                let dealerCurrent =
                    calculateHand(
                        dealerHand
                    );

                while (
                    dealerCurrent < 17
                ) {

                    dealerHand.push(
                        drawCard()
                    );

                    dealerCurrent =
                        calculateHand(
                            dealerHand
                        );
                }

                const playerCurrent =
                    calculateHand(
                        playerHand
                    );

                let result = "";
                let color = "Red";

                if (
                    dealerCurrent > 21 ||
                    playerCurrent > dealerCurrent
                ) {

                    db.prepare(`
                        UPDATE users
                        SET wallet = wallet + ?
                        WHERE user_id = ?
                    `).run(
                        bet * 2,
                        userId
                    );

                    result =
                        `🏆 Vitória!\n+${bet} ${KC}`;

                    color = "Green";

                } else if (
                    playerCurrent === dealerCurrent
                ) {

                    db.prepare(`
                        UPDATE users
                        SET wallet = wallet + ?
                        WHERE user_id = ?
                    `).run(
                        bet,
                        userId
                    );

                    result =
                        `🤝 Empate!\nAposta devolvida`;

                    color = "Yellow";

                } else {

                    result =
                        `💀 Derrota!`;
                }

                return button.update({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(color)
                            .setTitle("🃏 Resultado")
                            .setDescription(
                                `**Você**\n` +
                                `${handToString(playerHand)}\n` +
                                `Total: ${playerCurrent}\n\n` +

                                `**Dealer**\n` +
                                `${handToString(dealerHand)}\n` +
                                `Total: ${dealerCurrent}\n\n` +

                                result
                            )
                    ],
                    components: []
                });
            }
        );

        collector.on(
            "end",
            async (_, reason) => {

                if (reason === "time") {

                    try {

                        await msg.edit({
                            components: []
                        });

                    } catch {}
                }
            }
        );
    }
};