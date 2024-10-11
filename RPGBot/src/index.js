require('dotenv').config();
const { Client, IntentsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, Message, AttachmentBuilder } = require('discord.js');
const mongoose = require('mongoose');
const {Schema, model } = require('mongoose');
const Level = require('./Level');
const { resetRole, getRank } = require('./RoleUtils');
const UserRole = require("./UserRole");
const calculateXp = require('./calculateXp');
const cooldowns = new Set();
const canvacord  = require('canvacord')


const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.GuildPresences,
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
    console.log(`Received command: ${interaction.commandName}`);
      if (interaction.commandName === 'hey')
      {
        interaction.reply('Hello');
  
      }
      if (interaction.commandName === 'level')
      {
  
        getRank(interaction);
  
      }
      if (interaction.commandName === 'resetrole')
      {
    
        resetRole(interaction);
    
      }
    

  }
  try {
    if (interaction.isButton()) // Role Select 
    {

      if (cooldowns.has(interaction.user.id)) {
        await interaction.reply({ content: 'Please wait before interacting again.', ephemeral: true });
        return;  // Exit the interaction if the user is on cooldown
      }
      cooldowns.add(interaction.user.id);
      const role = interaction.guild.roles.cache.get(interaction.customId);

      if (!role) {
        await interaction.reply({ content: 'Role not found', ephemeral: true });
        return;
      }

      const userRole =  await UserRole.findOne({ userId: interaction.member.id });

      if (userRole) {
        await interaction.reply({
          content: `You already have a role. To reset your role, use the /resetrole command.`,
          ephemeral: true
        });
        return;
      }
      //console.log(hasRole);

      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply();
      }
      
      try {
        await interaction.member.roles.add(role);
        await new UserRole({
          userId: interaction.member.id,
          roleId: role.id
        }).save();
        await interaction.followUp({ content: `You have selected the ${role.name} class.`, ephemeral: true });
      }
      catch (e) {
        console.error('Error during role assignment:', e);
        await interaction.followUp({ content: 'An error occurred while assigning your role. Please try again later.', ephemeral: true });

      }
      setTimeout(() => {
        cooldowns.delete(interaction.user.id);
      }, 20000);
      
    }
  } catch (error) {
    console.error('Error handling interaction:', error);
    if (interaction.isButton()) {
        await interaction.reply({ content: 'An error occurred with your interaction.', ephemeral: true });
    }
}
  
    

});


// CLIENT READY, on startup //


client.on('ready', async () => {
  console.log(`${client.user.tag} is online`);

  const channel = await client.channels.cache.get('1139015166437113916') // channel for role select
  if (channel) {
    const existingRoleSelection = await UserRole.findOne({ guildId: channel.guild.id });
    
    // Check if the user already selected a role
    if (!existingRoleSelection) {
      setupRoleMessage(channel); // Only setup role message if no role is selected
    }
  }
});

// END CLIENT READY//

client.on("messageCreate", (message) => {
  // CREATES THE LEVEL SCHEMA PER THE USER (if exists adds XP)
   xpGiver(message);
});

// ------------------------------- END CLIENT INTERACTION ------------------------------- //




// ------------------------------- USER LEVEL ON MESSAGE ------------------------------- //
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

// ------------------------------- END USER LEVEL ON MESSAGE ------------------------------- //




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