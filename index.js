const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, VoiceConnectionStatus } = require('@discordjs/voice');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ]
});

// Define an array of custom status messages
const statusMessages = [
  'Helping BilloXD',
  'Watching Members',
  'Editing Reels!',
  'dsc/gg/billoxd'
];

// Create an Express server
const app = express();
const port = process.env.PORT || 3000; // Use the port provided by Render or default to 3000

app.get('/', (req, res) => {
  res.send('Bot is running');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

let connection; // Variable to keep track of the voice connection

const reconnectVoiceChannel = async () => {
  try {
    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    if (!guild) return console.error('Guild not found');

    const voiceChannel = guild.channels.cache.get(process.env.VOICE_CHANNEL_ID);
    if (!voiceChannel) return console.error('Voice channel not found');

    if (connection) {
      console.log('Disconnecting previous connection');
      connection.destroy(); // Destroy the previous connection if it exists
    }

    connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
    });

    connection.on(VoiceConnectionStatus.Ready, () => {
      console.log('Bot has reconnected to the voice channel!');
    });

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      console.log('Bot has been disconnected from the voice channel');
      // Reattempt reconnection
      await reconnectVoiceChannel();
      
      // Get the user to DM
      const user = await client.users.fetch(process.env.USER_ID);
      if (user) {
        user.send('The bot has disconnected from the voice channel.').catch(console.error);
      } else {
        console.error('User not found');
      }
    });

  } catch (error) {
    console.error('Error reconnecting to voice channel:', error);
  }
};

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);

  // Function to set the custom status
  const setCustomStatus = (status) => {
    client.user.setPresence({
      activities: [{ name: status, type: 0 }],
      status: 'online'
    });
  };

  // Set an initial status
  setCustomStatus(statusMessages[0]);

  // Change status every 30 seconds (30000 milliseconds)
  let index = 0;
  setInterval(() => {
    index = (index + 1) % statusMessages.length;
    setCustomStatus(statusMessages[index]);
  }, 30000);

  reconnectVoiceChannel(); // Attempt to connect to the voice channel when the bot starts
});

client.login(process.env.TOKEN);
