require('dotenv').config();
const { REST, Routes, ApplicationCommandOptionType } = require('discord.js');

const commands = [
    {
        name: 'hey',
        description: 'Replies with hey'
    },
    {
        name: 'level',
        description: 'shows your level and stats',
        options: [
            {
                name: 'target-user',
                description: 'the user card you want to see',
                type: ApplicationCommandOptionType.Mentionable,
            }
        ]
    },
    {
        name: 'resetrole',
        description: 'Resets your selected role to none',
    },
    {
        name: 'duel',
        description: 'duel this user!',
        options: [
            {
                name: 'target-user',
                description: 'the user card you want to see',
                type: ApplicationCommandOptionType.Mentionable,
            }
        ]
    },
    
];

const rest = new REST({ version: '10'}).setToken(process.env.TOKEN);

(async () => {
    try {

        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands }
        )
       
        console.log("slash commands registered")
    } catch (e) {
        console.log(`There was an error ${e}`)
    }
})(); 