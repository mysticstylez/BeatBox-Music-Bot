//BeatBox Discord Music bot
//Developed by Ghostdog (mysticstylez)

const { 
  Client, 
  GatewayIntentBits, 
  PermissionsBitField 
} = require('discord.js');
const { 
  joinVoiceChannel, 
  createAudioPlayer, 
  createAudioResource, 
  AudioPlayerStatus 
} = require('@discordjs/voice');
const { ActionRowBuilder, StringSelectMenuBuilder } = require('@discordjs/builders');
const play = require('play-dl');
const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const inactivityTimeout = 30 * 60 * 1000; // 30 minutes in milliseconds
let timeout = null;

// Set SoundCloud API credentials
play.setToken({
  soundcloud: {
    client_id: 'Your Soundcloud Client ID',
  },
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: ['CHANNEL'], // Required for DMs
});

const prefix = '?';
const validCommands = [
  'about', 'add', 'leave', 'play', 'stop', 'skip', 
  'playlist', 'level', 'wipelevel', 'commands', 'register', 'rewards', 'songlist'
];

const rewards = [
  { name: 'Reward 1', level: 8, cost: 20000 },
  { name: 'Reward 2', level: 9, cost: 40000 },
  { name: 'Reward 3', level: 10, cost: 60000 }
];

const queue = new Map();
const musicFolder = './Music';
const OWNER_ID = 'Your Discord Owner ID'; // Replace with your Discord user ID
const levelDataFile = './levels.json'; // File to store user level data
let levelData = loadLevelData();

const levelTitles = [
  'Rhythm Schism', 'Groove Moves', 'Bass Ace', 'Funk Junk',
  'Vibe Tribe', 'Tune Spoon', 'Jam Slam', 'Sonic Bubonic',
  'DJ Icy', 'Beat Master'
];

client.on('messageCreate', async (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // Check if the command is valid before granting EXP and BBC
  if (validCommands.includes(command)) {
    handleUserExp(message.author, message.channel); // Pass channel for notifications
  }

  const serverQueue = queue.get(message.guild?.id);

  // Command handling logic
  if (command === 'songlist') {
  try {
    // Read all files from the music directory with specific formats
    const files = fs.readdirSync(musicFolder).filter(file =>
      file.endsWith('.mp3') || file.endsWith('.flac') || file.endsWith('.wav')
    );

    if (files.length === 0) {
      return message.channel.send('No songs available in the music directory.');
    }

    // Count the number of songs
    const songCount = files.length;

    // Format the file list with bullets
    const songList = files.map(file => `• ${path.basename(file, path.extname(file))}`);
    
    // Helper function to split long messages into chunks
    const splitMessage = (textArray, maxLength) => {
      const chunks = [];
      let currentChunk = '';

      for (const item of textArray) {
        if (currentChunk.length + item.length + 1 > maxLength) {
          chunks.push(currentChunk);
          currentChunk = item + '\n';
        } else {
          currentChunk += item + '\n';
        }
      }
      if (currentChunk) chunks.push(currentChunk);
      return chunks;
    };

    // Split song list into multiple chunks
    const songListChunks = splitMessage(songList, 4096 - 50); // Reserve space for song count and formatting

    // Send each chunk as a separate embed
    for (let i = 0; i < songListChunks.length; i++) {
      const embed = new EmbedBuilder()
        .setTitle('Available Songs')
        .setDescription(
          i === 0
            ? `**Total Songs: ${songCount}**\n\n${songListChunks[i]}` // Add count to the first embed
            : songListChunks[i]
        )
        .setColor(0xff69b4);

      await message.channel.send({ embeds: [embed] });
    }
  } catch (error) {
    console.error('Error reading songs:', error);
    message.channel.send('An error occurred while retrieving the song list.');
  }
}

//Commands start
 else if (command === 'add') {
    const owner = await client.users.fetch(OWNER_ID);
    const ownerMessage = args.join(' ');

    if (!ownerMessage) return message.reply('Please provide a message to send.');

    try {
      await owner.send(`New message from ${message.author.tag}: "${ownerMessage}"`);
      message.reply('Your request has been sent.');
    } catch (error) {
      console.error('Error sending request:', error);
      message.reply('Failed to send the request.');
    }
  } else if (command === 'register') {
    const email = args.join(' ');
    if (!email) return message.reply('Please provide your email address.');

    try {
      const owner = await client.users.fetch(OWNER_ID);
      await owner.send(`User ${message.author.tag} (${message.author.id}) registered with the email: ${email}`);
      message.reply('Your registration has been sent.');
    } catch (error) {
      console.error('Error sending registration:', error);
      message.reply('Failed to send your registration.');
    }
  } else if (command === 'rewards') {
    const userData = levelData[message.author.id] || { level: 0, cash: 0 };
    const availableRewards = rewards.filter(r => userData.level >= r.level);

    if (availableRewards.length === 0) {
      return message.reply('You currently have no rewards available.');
    }

    const rewardsList = availableRewards
      .map(r => `**${r.name}** - Level ${r.level}, Cost: ${r.cost} BBC`)
      .join('\n');

    const embed = new EmbedBuilder()
      .setTitle(`${message.author.username}'s Available Rewards`)
      .setDescription(rewardsList)
      .setColor(0xff69b4);

    message.channel.send({ embeds: [embed] });

    try {
      const owner = await client.users.fetch(OWNER_ID);
      await owner.send(`User ${message.author.tag} has rewards available: ${rewardsList}`);
    } catch (error) {
      console.error('Error sending rewards notification:', error);
    }
  } else if (command === 'about') {
    message.channel.send(
      `**BeatBox Music Bot**\nVersion: 0.0.3a\nDeveloper: Ghostdog Studio\n\n"Though this be madness, yet there is method in 't"`
    );
  } else if (command === 'commands') {
    const embed = new EmbedBuilder()
      .setTitle('Available Commands')
      .addFields(
        { name: '`?about`', value: 'Display bot info.', inline: false },
        { name: '`?add <message>`', value: 'Add new song to library.', inline: false },
        { name: '`?leave`', value: 'Disconnect the bot from the voice channel.', inline: false },
        { name: '`?play <song>`', value: 'Add a music track to the queue.', inline: false },
        { name: '`?stop`', value: 'Stop all tracks.', inline: false },
        { name: '`?skip`', value: 'Skip the current track.', inline: false },
        { name: '`?playlist <artist>`', value: 'Add 5 random songs by the artist to the queue.', inline: false },
        { name: '`?level`', value: 'Check your current level and experience.', inline: false },
        { name: '`?rewards`', value: 'Check your available rewards.', inline: false },
        { name: '`?register <email>`', value: 'Register your email for rewards.', inline: false },
        { name: '`?wipelevel`', value: 'Reset all user levels and experience (Owner only).', inline: false },
        { name: '`?songlist`', value: 'List all songs available in the music directory.', inline: false } // Added songlist command here
      )
      .setColor(0xff69b4);

    message.channel.send({ embeds: [embed] });
  } else if (command === 'level') {
    displayUserLevel(message);
  } else if (command === 'wipelevel' && message.author.id === OWNER_ID) {
    for (const userId in levelData) {
      if (levelData.hasOwnProperty(userId)) {
        levelData[userId].level = 0;
        levelData[userId].exp = 0;
      }
    }
    saveLevelData();
    message.channel.send('All user levels and experience have been reset.');
  } else if (command === 'play') {
    await handlePlayCommand(message, args, serverQueue);
  } else if (command === 'skip') {
    if (!serverQueue || serverQueue.songs.length === 0) return message.channel.send('There is no song to skip.');
    message.channel.send(`Skipping: **${serverQueue.songs[0].title}**`);
    playSong(message.guild);
  } else if (command === 'stop') {
    if (!serverQueue) return message.channel.send('There is no music to stop.');
    serverQueue.songs = [];
    serverQueue.player.stop();
    serverQueue.isPlaying = false;
    message.channel.send('Music stopped. You can queue new songs.');
  } else if (command === 'leave') {
    if (!serverQueue) return message.channel.send('I am not in a voice channel.');
    serverQueue.connection.destroy();
    queue.delete(message.guild.id);
    message.channel.send('Left the voice channel.');
  } else if (command === 'playlist') {
    await handlePlaylistCommand(message, args);
  }
});

async function handlePlayCommand(message, args, serverQueue) {
  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel) return message.channel.send('Join a voice channel to play music!');

  const permissions = voiceChannel.permissionsFor(message.client.user);
  if (!permissions.has(PermissionsBitField.Flags.Connect) || !permissions.has(PermissionsBitField.Flags.Speak)) {
    return message.channel.send('I need permission to join and speak in the voice channel.');
  }

  const query = args.join(' ');
  if (!query) return message.channel.send('Please provide the name of the song or artist.');

  try {
    const song = findLocalSong(query) || await searchSoundCloud(query);
    if (!serverQueue) initializeQueue(message, song, voiceChannel);
    else addToQueue(message, song);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function handlePlaylistCommand(message, args) {
  const artist = args.join(' ');
  if (!artist) return message.channel.send('Please provide the name of the artist.');

  try {
    const songs = await searchSoundCloudPlaylist(artist);
    if (songs.length === 0) throw new Error('No valid songs found.');

    message.channel.send(`Adding **${songs.length}** songs by **${artist}** to the queue.`);
    const serverQueue = queue.get(message.guild.id);
    if (!serverQueue) {
      initializeQueue(message, songs[0], message.member.voice.channel);
      songs.slice(1).forEach((song) => addToQueue(message, song));
    } else {
      songs.forEach((song) => addToQueue(message, song));
    }
  } catch (error) {
    console.error('Error fetching playlist:', error.message);
    message.channel.send(`No songs found for **${artist}**.`);
  }
}

async function searchSoundCloud(query) {
  const searchResults = await play.search(query, { source: { soundcloud: 'tracks' }, limit: 1 });
  if (!searchResults.length) throw new Error('No results found on SoundCloud.');

  const track = searchResults[0];
  const stream = await play.stream(track.url, { quality: 2, highWaterMark: 1 << 25 });

  return { title: track.name, resource: createAudioResource(stream.stream, { inputType: stream.type }) };
}

async function searchSoundCloudPlaylist(artist) {
  const searchResults = await play.search(artist, { source: { soundcloud: 'tracks' }, limit: 5 });
  const songs = [];

  for (const track of searchResults) {
    try {
      const stream = await play.stream(track.url, { quality: 2, highWaterMark: 1 << 25 });
      songs.push({ title: track.name, resource: createAudioResource(stream.stream, { inputType: stream.type }) });
    } catch (error) {
      console.error(`Error streaming ${track.name}:`, error.message);
    }
  }

  return songs;
}

function findLocalSong(query) {
  // Normalize query: Trim and convert to lowercase
  const normalizedQuery = query.trim().toLowerCase();

  // Split the normalized query into words
  const queryWords = normalizedQuery.split(' ');

  // Access the music folder
  const files = fs.readdirSync(musicFolder);

  // Try splitting the query at each possible point to create artist-title pairs
  for (let i = 1; i < queryWords.length; i++) {
    // Join the first part as artist and the remaining as title
    const artist = queryWords.slice(0, i).join(' ');
    const title = queryWords.slice(i).join(' ');

    // Construct the search pattern in the format "artist - title"
    const searchPattern = `${artist} - ${title}`;

    // Look for a file that includes the search pattern
    const songFile = files.find((file) => {
      const normalizedFile = file.toLowerCase();
      return normalizedFile.includes(searchPattern);
    });

    if (songFile) {
      const songPath = path.join(musicFolder, songFile);
      return { 
        title: path.basename(songPath, path.extname(songPath)), 
        resource: createAudioResource(songPath) 
      };
    }
  }

  // If no match is found, return null :(
  return null;
}

function initializeQueue(message, song, voiceChannel) {
  const queueConstruct = { 
    textChannel: message.channel, 
    voiceChannel, 
    connection: null, 
    player: createAudioPlayer(), 
    songs: [song], 
    isPlaying: false 
  };
  
  queue.set(message.guild.id, queueConstruct);

  const connection = joinVoiceChannel({ 
    channelId: voiceChannel.id, 
    guildId: message.guild.id, 
    adapterCreator: message.guild.voiceAdapterCreator 
  });
  
  queueConstruct.connection = connection;
  connection.subscribe(queueConstruct.player);

  // Reset inactivity timer
  resetInactivityTimer(message.guild.id);

  playSong(message.guild);
}

function addToQueue(message, song) {
  const serverQueue = queue.get(message.guild.id);
  serverQueue.songs.push(song);
  if (!serverQueue.isPlaying) playSong(message.guild);
  else message.channel.send(`**${song.title}** has been added to the queue!`);
}

function playSong(guild) {
  const serverQueue = queue.get(guild.id);
  
  if (!serverQueue || serverQueue.songs.length === 0) {
    serverQueue.isPlaying = false;
    serverQueue.textChannel.send('Queue finished.');

    // Start the inactivity timer if there are no more songs
    startInactivityTimer(guild.id);
    return;
  }

  const song = serverQueue.songs.shift();

  // Create and play the audio resource
  serverQueue.player.play(song.resource);
  serverQueue.isPlaying = true;

  serverQueue.textChannel.send(`Now playing: **${song.title}**`);

  // Reset inactivity timer whenever a new song starts
  resetInactivityTimer(guild.id);

  // When the song ends, check if there are more songs in the queue and play the next
  serverQueue.player.once(AudioPlayerStatus.Idle, () => {
    if (serverQueue.songs.length > 0) {
      playSong(guild); // Play the next song in the queue
    } else {
      serverQueue.isPlaying = false;
      serverQueue.textChannel.send('Queue finished.');

      // Start the inactivity timer if no more songs are in the queue
      startInactivityTimer(guild.id);
    }
  });

  // Handle any errors during playback
  serverQueue.player.on('error', (error) => console.error('Player Error:', error.message));
}

function resetInactivityTimer(guildId) {
    if (timeout) clearTimeout(timeout); // Clear existing timer
    timeout = setTimeout(() => startInactivityTimer(guildId), inactivityTimeout);
}

function startInactivityTimer(guildId) {
  timeout = setTimeout(() => {
    const serverQueue = queue.get(guildId);
    if (serverQueue && serverQueue.connection) {
      serverQueue.connection.destroy();  // Leave the voice channel
      queue.delete(guildId);             // Remove the queue
      serverQueue.textChannel.send('I have left the channel due to inactivity.');
    }
  }, inactivityTimeout);
}

//BeatBox Exp & Rewards
function handleUserExp(user, channel) {
  if (!levelData[user.id]) levelData[user.id] = { exp: 0, level: 0, cash: 0 };

  const earnedBBC = Math.floor(Math.random() * 10) + 1;
  levelData[user.id].cash += earnedBBC;
  levelData[user.id].exp += 10;

  const currentLevel = levelData[user.id].level;
  const expToNextLevel = 100 * Math.pow(2, currentLevel);

  if (levelData[user.id].exp >= expToNextLevel) {
    levelData[user.id].level++;
    levelData[user.id].exp = 0;

    const newTitle = levelTitles[levelData[user.id].level - 1] || 'Music Legend';

    const congratsMessage = 
      `🎉 **Congratulations, ${user.username}!** 🎉\n` +
      `You have just leveled up to **Level ${levelData[user.id].level}**!\n` +
      `🏅 **Title:** ${newTitle}\n💰 **BBC Earned:** ${earnedBBC} BBC`;

    const embed = new EmbedBuilder()
      .setTitle('Level Up!')
      .setDescription(`🎉 **${user.username}** reached level ${levelData[user.id].level}!\n` +
                      `🏅 **Title:** ${newTitle}\n💰 **Total BBC:** ${levelData[user.id].cash} BBC`)
      .setColor(0xff69b4);

    user.send({ embeds: [embed] }).catch(console.error);
    if (channel) channel.send(congratsMessage);
  } else {
    channel.send(`💰 **${user.username}**, you earned **${earnedBBC} BeatBox Cash (BBC)**!`);
  }

  saveLevelData();
}

function displayUserLevel(message) {
  const user = message.author;
  const userData = levelData[user.id] || { level: 0, exp: 0, cash: 0 }; // Initialize with cash field if missing
  const title = levelTitles[userData.level - 1] || 'Unranked';

  const embed = new EmbedBuilder()
    .setTitle(`${user.username}'s Level`)
    .setDescription(
      `🏅 **Level:** ${userData.level}\n` +
      `🎵 **Title:** ${title}\n` +
      `💪 **EXP:** ${userData.exp}/${100 * Math.pow(2, userData.level)}\n` +
      `💰 **Total BBC:** ${userData.cash} BBC`
    )
    .setColor(0xff69b4); 

  message.channel.send({ embeds: [embed] });
}

function loadLevelData() {
  if (!fs.existsSync(levelDataFile)) fs.writeFileSync(levelDataFile, JSON.stringify({}));
  return JSON.parse(fs.readFileSync(levelDataFile));
}

function saveLevelData() {
  fs.writeFileSync(levelDataFile, JSON.stringify(levelData, null, 2));
}

client.login('Your Discord Bot Token');
