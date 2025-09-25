const { Client, GatewayIntentBits, PermissionsBitField, ChannelType } = require('discord.js');
const express = require('express');
const app = express();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const token = process.env.DISCORD_TOKEN;
const siteLink = 'https://sites.google.com/view/soverignlandsrealm';
const guildId = 'YOUR_GUILD_ID';
let countries = {};

async function setupGlobalChannels(guild) {
  if (guild.channels.cache.find(c => c.name === 'World Chat')) return;

  await guild.channels.create({ name: 'World Chat', type: ChannelType.GuildText });
  await guild.channels.create({ name: 'World VC', type: ChannelType.GuildVoice });

  const unCategory = await guild.channels.create({ name: 'United Nations', type: ChannelType.GuildCategory });
  await guild.channels.create({ name: 'UN Chat', type: ChannelType.GuildText, parent: unCategory.id });
  await guild.channels.create({ name: 'UN VC', type: ChannelType.GuildVoice, parent: unCategory.id });

  const cuCategory = await guild.channels.create({ name: 'CU Council', type: ChannelType.GuildCategory });
  await guild.channels.create({ name: 'CU Chat', type: ChannelType.GuildText, parent: cuCategory.id });
  await guild.channels.create({ name: 'CU VC', type: ChannelType.GuildVoice, parent: cuCategory.id });

  console.log('✅ Global channels created!');
}

async function createCountry(message, countryName, color='BLUE') {
  const guild = message.guild;
  if (countries[countryName.toLowerCase()]) return message.channel.send('❌ Country exists.');

  const role = await guild.roles.create({ name: countryName, color, mentionable: true });
  const category = await guild.channels.create({
    name: countryName,
    type: ChannelType.GuildCategory,
    permissionOverwrites: [
      { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
      { id: role.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.Connect] }
    ]
  });
  await guild.channels.create({ name: 'general', type: ChannelType.GuildText, parent: category.id });
  await guild.channels.create({ name: 'General VC', type: ChannelType.GuildVoice, parent: category.id });

  countries[countryName.toLowerCase()] = { roleId: role.id, categoryId: category.id, leaderId: message.author.id, capital: null, claims: [] };
  message.channel.send(`✅ Country **${countryName}** created! 🌐 ${siteLink}`);
}

async function joinCountry(message, countryName) {
  const guild = message.guild;
  const country = countries[countryName.toLowerCase()];
  if (!country) return message.channel.send('❌ Country not found.');
  await message.member.roles.add(country.roleId);
  message.channel.send(`✅ You joined **${countryName}**!`);
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  const guild = client.guilds.cache.get(guildId);
  if (!guild) return console.log('❌ Guild not found.');
  setupGlobalChannels(guild);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  const args = message.content.trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === '!ping') message.channel.send('Pong!');
  if (command === '!createcountry') createCountry(message, args[0], args[1]||'BLUE');
  if (command === '!join') joinCountry(message, args[0]);
  if (command === '!website') message.channel.send(`🌐 Realm website: ${siteLink}`);
});

app.get('/', (req,res) => res.send('Bot is running!'));
app.listen(3000, ()=>console.log('Web server running on port 3000'));

client.login(token);
