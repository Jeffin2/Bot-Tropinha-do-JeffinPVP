const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const db = require("../database/database");

const KC = "<:PVPCoin:1515754712245211318>";

module.exports = {

data: new SlashCommandBuilder()
    .setName("pagar")
    .setDescription("Pagar outro usuário")
    .addUserOption(opt =>
        opt
            .setName("usuario")
            .setDescription("Usuário que vai receber o pagamento")
            .setRequired(true)
    )
    .addIntegerOption(opt =>
        opt
            .setName("quantia")
            .setDescription("Quantidade de PVPCoins")
            .setRequired(true)
    ),

async execute(interaction) {

    const userId = interaction.user.id;
    const target = interaction.options.getUser("usuario");
    const amount = interaction.options.getInteger("quantia");

    if (amount <= 0) {
        return interaction.reply({
            content: "❌ Valor inválido",
            ephemeral: true
        });
    }

    const user = db.prepare(`
        SELECT * FROM users WHERE user_id = ?
    `).get(userId);

    if (!user || user.wallet < amount) {
        return interaction.reply({
            content: "❌ Saldo insuficiente",
            ephemeral: true
        });
    }

    // tira do remetente
    db.prepare(`
        UPDATE users
        SET wallet = wallet - ?
        WHERE user_id = ?
    `).run(amount, userId);

    // adiciona no destinatário
    db.prepare(`
        UPDATE users
        SET wallet = wallet + ?
        WHERE user_id = ?
    `).run(amount, target.id);

    return interaction.reply({
        embeds: [
            new EmbedBuilder()
                .setColor("Blue")
                .setDescription(`💸 Você pagou **${amount} ${KC}** para ${target}`)
        ]
    });
}
};