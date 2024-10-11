const { Client, IntentsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, Message, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const UserRole = require("./UserRole");
const calculateXp = require('./calculateXp');
const Level = require('./Level');
const canvacord  = require('canvacord')
const fontArray = [
    {
    path: "font/StorybookEnding-nRLX0.ttf",
    name: 'Storybook Ending',
    } 
  ];


async function resetRole(interaction) {
    const userRole = await UserRole.findOne({ userId: interaction.member.id });

    if (!userRole) {
        return interaction.reply({ content: 'You do not have a role to reset.', ephemeral: true });
    }

    const role = interaction.guild.roles.cache.get(userRole.roleId);

    if (role) {
        await interaction.member.roles.remove(role);
        await UserRole.deleteOne({ userId: interaction.member.id })

        interaction.reply({ content: 'Your role has been successfully reset.', ephemeral: true });
    } else {
        interaction.reply({ content: 'Failed to find your role.', ephemeral: true });
    }
    
    
}


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
    const embed = new EmbedBuilder()
    .setColor('#F1C40F')
    .setTitle(`Rank Information for ${targetUserObj.user.username}`)
    .setDescription('Here are your level and XP details:')
    .addFields(
        { name: 'Class', value: `${targetUserObj.user.username}`, inline: true },
        { name: 'Level', value: `${fetchedLevel.level}`, inline: true },
        { name: 'Current XP', value: `${fetchedLevel.xp}`, inline: true },
        { name: 'Required XP', value: `${calculateXp(fetchedLevel.level)}`, inline: true }
    )
    .setFooter({ text: 'Keep leveling up!' });
    


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
  
    interaction.editReply({ 
        embeds: [embed],
        files: [attachment]
    });
  
  
  
  }
  
  // ------------------------------- END RANKCARD FUNCTION ------------------------------- //


module.exports = {
    resetRole,
    getRank
  };