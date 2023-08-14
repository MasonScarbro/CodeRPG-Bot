require('dotenv').config();
const { Client, IntentsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, Message, } = require('discord.js');
const mongoose = require('mongoose');
const {Schema, model } = require('mongoose');
const Level = require('./Level');
const calculateXp = require('./calculateXp');
const cooldowns = new Set();


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





// ------------------------------- CLIENT INTERACTION ------------------------------- //
client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand())
  {
    if (interaction.commandName === 'hey')
    {
      interaction.reply('This Functions');

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


// CLIENT READY, on startup //


client.on('ready', async () => {
  console.log(`${client.user.tag} is online`);

  const channel = await client.channels.cache.get('1139015166437113916') // channel for role select
if (channel) {
  setupRoleMessage(channel); // role select button make function
}
});

// END CLIENT READY//

client.on("messageCreate", (message) => {
  // CREATES THE LEVEL SCHEMA PER THE USER (if exists adds XP)
   xpGiver(message);
});

// ------------------------------- END CLIENT INTERACTION ------------------------------- //





 function getRandomXp(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min);



}


async function xpGiver(message) {
  console.log('xpGiver function called');
  if (!message.inGuild() || message.author.bot) {
    console.log('INCORRECT')
    return;
  } else {

  const xpToGive = getRandomXp(5, 15); // 5 or 15
  const query = {
    userId: message.author.id,
    guildId: message.guild.id,
  };

  try {
    const level = await Level.findOne(query);

    if (level) 
    {
      level.xp += xpToGive;

      if (level.xp > calculateXp(level.level)) 
      {
        level.xp = 0;
        level.level += 1;

        message.channel.send(`${message.member} you have leveled up to level: ${level.level}`);
      }

      await level.save();
    } 
    else 
    {
      const newLevel = new Level({
        userId: message.author.id,
        guildId: message.guild.id,
        xp: xpToGive,
      });

      await newLevel.save();
    }
  } catch (e) {
    console.log(e);
  }

  }


  
}



// ------------------------------- MONGO DB CONNECTION ------------------------------- //

(async () => {
  try 
  {
    mongoose.set('strictQuery', false);
    await mongoose.connect(process.env.MONGODB_URI, {keepAlive: true});
    console.log("connected to db")

    client.login(process.env.TOKEN);


  } catch (e) 
  {
    console.log(e);
  }
  
})();


// ------------------------------- END MONGO DB CONNECTION ------------------------------- //



 // LOGIN FOR RPG BOT