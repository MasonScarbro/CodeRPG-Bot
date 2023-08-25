require('dotenv').config();
const { Client, IntentsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, Message, AttachmentBuilder } = require('discord.js');
const mongoose = require('mongoose');
const {Schema, model } = require('mongoose');
const Level = require('./Level');
const calculateXp = require('./calculateXp');
const cooldowns = new Set();
const canvacord  = require('canvacord')
const fontArray = [
  {
  path: "C:\Users\Admin\Desktop\DiscordBot\CodeRPG-Bot\RPGBot\font\StorybookEnding-nRLX0.ttf",
  name: 'Storybook Ending',
  } 
];

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
    if (interaction.commandName === 'hey')
    {
      interaction.reply('This Functions');

    }
    if (interaction.commandName === 'level')
    {

      getRank(interaction);

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
      console.log(hasRole);
      await interaction.deferReply({ ephemeral: true });
  
      await interaction.member.roles.set([]);
      await interaction.editReply(`Remember you can only select one role all previous ones have been removed if any!`);
      await interaction.member.roles.add(role);
      await interaction.editReply(`the ${role} class has been added`);

      
  

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

// ------------------------------- RANKCARD FUNCTION ------------------------------- //
async function getRank(interaction){

  if (!interaction.inGuild()){
    interaction.reply('Must send in server');
    return;

  }

  await interaction.deferReply();

  const mentionedUserId = interaction.options.get('target-user')?.value; //targeted user value
  const targetUserId = mentionedUserId || interaction.member.id; // either the target or the one who sent the message
  const targetUserObj = await interaction.guild.members.fetch(targetUserId); // the target as an object fetched from the guild

  // the level fetched from the database
  const fetchedLevel = await Level.findOne({
    userId: targetUserId,
    guildId: interaction.guild.id,

  });

  // if the level wasnt found
  if (!fetchedLevel) {
    interaction.editReply(
      mentionedUserId ? `${targetUserObj.user.tag} doesnt have any levels yet` : 'you dont have any levels yet'
    )
    return;
  }

  // --- RANKING SYSTEM --- //

  let allLevels = await Level.find({ guildId: interaction.guild.id}).select('-_id userId level xp'); // find the all schemas with those tags i.e the level schemas (array)

  // sorts the levels in the all levels aray checking if each 2 levels is greater than one another 
  allLevels.sort((a, b) => {
    if (a.level === b.level) {
      return b.xp - a.xp;
    } else {
      return b.level - a.level // in the sorting alg if the first is greater than it will be positive so sort that way (since they are objects sorting by level specifically)
    }
  })


  let currentRank = allLevels.findIndex((lvl) => lvl.userId === targetUserId) + 1; // this is what actually detirmines the rank number finds the user that was referenceds index and adds 1 since its zeroed indexed 

  // --- END RANKING SYSTEM --- //

  const rank = new canvacord.Rank()
    .setAvatar(targetUserObj.user.displayAvatarURL({size: 256}))
    .setRank(currentRank)
    .setLevel(fetchedLevel.level)
    .setCurrentXP(fetchedLevel.xp)
    .setRequiredXP(calculateXp(fetchedLevel.level))
    .setProgressBar('#FFC300', 'COLOR')
    .setUsername(targetUserObj.user.username)
    .registerFonts(fontArray)
    .setDiscriminator(targetUserObj.user.discriminator);
  
  const data = await rank.build();

  const attachment = new AttachmentBuilder(data);

  interaction.editReply({ files: [attachment]});



}

// ------------------------------- END RANKCARD FUNCTION ------------------------------- //


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