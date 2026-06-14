const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

module.exports = {

    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Mostra a latência do bot"),

    async execute(interaction) {

        const ping =
            interaction.client.ws.ping;

        const embed =
            new EmbedBuilder()
                .setTitle("🏓 Pong!")
                .setColor("Green")
                .setDescription(
                    `📡 Latência: **${ping}ms**`
                );

        await interaction.reply({
            embeds: [embed]
        });
    }
};