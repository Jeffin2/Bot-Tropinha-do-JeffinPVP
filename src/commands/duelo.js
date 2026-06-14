const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const db = require("../database/database");

const KC = "<:PVPCoin:1515754712245211318>";

module.exports = {

    data: new SlashCommandBuilder()
        .setName("duelo")
        .setDescription("Desafie alguém para um duelo")
        .addUserOption(option =>
            option
                .setName("usuario")
                .setDescription("Quem será desafiado")
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName("aposta")
                .setDescription("Quantidade apostada")
                .setRequired(true)
        ),

    async execute(interaction) {

        const challenger = interaction.user;
        const opponent =
            interaction.options.getUser("usuario");

        const bet =
            interaction.options.getInteger("aposta");

        if (opponent.bot) {
            return interaction.reply({
                content:
                    "❌ Você não pode duelar contra bots.",
                ephemeral: true
            });
        }

        if (opponent.id === challenger.id) {
            return interaction.reply({
                content:
                    "❌ Você não pode duelar contra si mesmo.",
                ephemeral: true
            });
        }

        if (bet <= 0) {
            return interaction.reply({
                content:
                    "❌ Informe uma aposta válida.",
                ephemeral: true
            });
        }

        const challengerData =
            db.prepare(`
                SELECT *
                FROM users
                WHERE user_id = ?
            `).get(challenger.id);

        if (
            !challengerData ||
            challengerData.wallet < bet
        ) {
            return interaction.reply({
                content:
                    "❌ Você não possui PVPCoins suficientes.",
                ephemeral: true
            });
        }

        const row =
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("duelo_aceitar")
                        .setLabel("Aceitar")
                        .setStyle(ButtonStyle.Success),

                    new ButtonBuilder()
                        .setCustomId("duelo_recusar")
                        .setLabel("Recusar")
                        .setStyle(ButtonStyle.Danger)
                );

        const embed =
            new EmbedBuilder()
                .setColor("Orange")
                .setTitle("⚔️ Duelo")
                .setDescription(
                    `${opponent}, você foi desafiado por ${challenger}!\n\n💰 Aposta: **${bet} ${KC}**`
                );

        const msg =
            await interaction.reply({
                embeds: [embed],
                components: [row],
                fetchReply: true
            });

        const collector =
            msg.createMessageComponentCollector({
                time: 60000
            });

        collector.on(
            "collect",
            async button => {

                if (
                    button.user.id !== opponent.id
                ) {
                    return button.reply({
                        content:
                            "❌ Apenas o desafiado pode responder.",
                        ephemeral: true
                    });
                }

                if (
                    button.customId ===
                    "duelo_recusar"
                ) {

                    collector.stop();

                    return button.update({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("Red")
                                .setTitle("❌ Duelo recusado")
                                .setDescription(
                                    `${opponent} recusou o desafio.`
                                )
                        ],
                        components: []
                    });
                }

                let opponentData =
                    db.prepare(`
                        SELECT *
                        FROM users
                        WHERE user_id = ?
                    `).get(opponent.id);

                if (!opponentData) {

                    db.prepare(`
                        INSERT INTO users
                        (user_id, wallet, bank, xp, level, wins, losses)
                        VALUES (?, 0, 0, 0, 1, 0, 0)
                    `).run(opponent.id);

                    opponentData =
                        db.prepare(`
                            SELECT *
                            FROM users
                            WHERE user_id = ?
                        `).get(opponent.id);
                }

                if (
                    opponentData.wallet < bet
                ) {
                    collector.stop();

                    return button.update({
                        content:
                            "❌ O desafiado não possui saldo suficiente.",
                        embeds: [],
                        components: []
                    });
                }

                db.prepare(`
                    UPDATE users
                    SET wallet = wallet - ?
                    WHERE user_id = ?
                `).run(bet, challenger.id);

                db.prepare(`
                    UPDATE users
                    SET wallet = wallet - ?
                    WHERE user_id = ?
                `).run(bet, opponent.id);

                const challengerRoll =
                    Math.floor(
                        Math.random() * 100
                    ) + 1;

                const opponentRoll =
                    Math.floor(
                        Math.random() * 100
                    ) + 1;

                const winner =
                    challengerRoll >= opponentRoll
                        ? challenger
                        : opponent;

                const loser =
                    winner.id === challenger.id
                        ? opponent
                        : challenger;

                const prize =
                    bet * 2;

                db.prepare(`
                    UPDATE users
                    SET wallet = wallet + ?
                    WHERE user_id = ?
                `).run(prize, winner.id);

                db.prepare(`
                    UPDATE users
                    SET wins = wins + 1
                    WHERE user_id = ?
                `).run(winner.id);

                db.prepare(`
                    UPDATE users
                    SET losses = losses + 1
                    WHERE user_id = ?
                `).run(loser.id);

                collector.stop();

                return button.update({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("Gold")
                            .setTitle("⚔️ Resultado do Duelo")
                            .setDescription(
                                `🎲 ${challenger}: **${challengerRoll}**\n` +
                                `🎲 ${opponent}: **${opponentRoll}**\n\n` +
                                `🏆 Vencedor: ${winner}\n` +
                                `💰 Prêmio: **${prize} ${KC}**`
                            )
                    ],
                    components: []
                });
            }
        );

        collector.on(
            "end",
            async (_, reason) => {

                if (
                    reason === "time"
                ) {

                    try {

                        await msg.edit({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor("Grey")
                                    .setTitle("⌛ Duelo expirado")
                                    .setDescription(
                                        "Ninguém respondeu ao desafio."
                                    )
                            ],
                            components: []
                        });

                    } catch {}
                }
            }
        );
    }
};