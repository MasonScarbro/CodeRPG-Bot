require('dotenv').config();
const { Client, IntentsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');


const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

// -------------------------------- ROLE MESSAGE SETUP --------------------------------------- //
function setupRoleMessage(channel) {
  const roles = [
    {
        id: '1139011719151239238',
        label : 'Mage'
    },
    {
        id: '1139012138854264962',
        label : 'Cleric'
    },
    {
        id: '1139012208609722379',
        label : 'Warrior'
    },
    {
        id: '1139012311512780840',
        label : 'Rogue'
    }
]

try {

  const row = new ActionRowBuilder();

  roles.forEach((role) => {
      row.addComponents(
          new ButtonBuilder()
          .setCustomId(role.id)
          .setLabel(role.label)
          .setStyle(ButtonStyle.Primary)
      );
  });

  channel.send({
      content: 'Pick your class',
      components: [row]
  });


} catch (e) {
  console.log(e)
}
}

// -------------------------------- END ROLE MESSAGE SETUP --------------------------------------- //


// CLIENT READY, on startup //


client.on('ready', async () => {
    console.log(`${client.user.tag} is online`);

    const channel = await client.channels.cache.get('1139015166437113916') // channel for role select
  if (channel) {
    setupRoleMessage(channel); // role select button make function
  }
});

// END CLIENT READY//


// ------------------------------- CLIENT INTERACTION ------------------------------- //
client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand())
  {
    if (interaction.commandName == 'hey')
    {
      interaction.reply('Hey this TEST worked');

    }

  }

  if (interaction.isButton()) // Role Select 
    {
      const role = interaction.guild.roles.cache.get(interaction.customId);

      if (!role) {
        interaction.editReply({
          content: 'Not found'
        })
        return;
      }

      const hasRole = interaction.member.roles.cache.has(role.id);
      
      await interaction.deferReply({ ephemeral: true });
  
      if (hasRole) {
        await interaction.member.roles.remove(role);
        await interaction.editReply(`the ${role} class has been removed`)
        return;
      } else {
        await interaction.member.roles.add(role)
        await interaction.editReply(`the ${role} class has been added`)

      }
  

    }
});

// ------------------------------- END CLIENT INTERACTION ------------------------------- //




client.login(process.env.TOKEN); // LOGIN FOR RPG BOT