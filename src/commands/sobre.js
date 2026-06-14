const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

module.exports = {

    data: new SlashCommandBuilder()
        .setName("sobre")
        .setDescription("Informações do servidor"),

    async execute(interaction) {

        const embed =
            new EmbedBuilder()

                .setTitle("🏥 Tropinha do JeffinPVP")
                .setColor("Red")

                .setDescription(
                    "Servidor oficial da comunidade."
                )

                .addFields(
                    {
                        name: "👑 Dono",
                        value: "@jeffinpvp",
                        inline: true
                    },
                    {
                        name: "📅 Fundação",
                        value: "2026",
                        inline: true
                    },
                    {
                        name: "🎮 Tema",
                        value: "Comunidade e diversão",
                        inline: false
                    }
                )

                .setThumbnail(
                    interaction.guild.iconURL({
                        dynamic: true
                    })
                );

        await interaction.reply({
            embeds: [embed]
        });
    }
};