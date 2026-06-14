const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const db = require("../database/database");

const KC = "<:PVPCoin:1515754712245211318>";

module.exports = {

data: new SlashCommandBuilder()
    .setName("trabalhar")
    .setDescription("Trabalhe e ganhe PVPCoins"),

async execute(interaction) {

    const userId = interaction.user.id;

    // garante usuário
    let user = db.prepare(`
        SELECT * FROM users WHERE user_id = ?
    `).get(userId);

    if (!user) {
        db.prepare(`
            INSERT INTO users (user_id, wallet, bank, xp, level)
            VALUES (?, 0, 0, 0, 1)
        `).run(userId);

        user = db.prepare(`
            SELECT * FROM users WHERE user_id = ?
        `).get(userId);
    }

    // tabela de cooldown
    db.prepare(`
        CREATE TABLE IF NOT EXISTS work_cooldown (
            user_id TEXT PRIMARY KEY,
            last_claim INTEGER
        )
    `).run();

    const data = db.prepare(`
        SELECT * FROM work_cooldown WHERE user_id = ?
    `).get(userId);

    const now = Date.now();
    const cooldown = 10 * 60 * 1000; // 10 minutos

    if (data && now - data.last_claim < cooldown) {

        const remaining = cooldown - (now - data.last_claim);

        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);

        return interaction.reply({
            content: `⏳ Você já trabalhou! Volte em **${minutes}m ${seconds}s**.`,
            ephemeral: true
        });
    }

    // recompensa
    const reward = Math.floor(Math.random() * 150) + 50;

    db.prepare(`
        UPDATE users
        SET wallet = wallet + ?
        WHERE user_id = ?
    `).run(reward, userId);

    db.prepare(`
        INSERT OR REPLACE INTO work_cooldown
        (user_id, last_claim)
        VALUES (?, ?)
    `).run(userId, now);

    const embed = new EmbedBuilder()
        .setColor("Green")
        .setTitle("👷 Trabalho concluído!")
        .setDescription(`Você ganhou **${reward} ${KC}**`)
        .setTimestamp();

    return interaction.reply({ embeds: [embed] });
}
};