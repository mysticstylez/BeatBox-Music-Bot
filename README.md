# BeatBox-Music-Bot
A music bot for Discord in Node.js

BeatBox is a Discord music bot which can play music from Soundcloud, remote and local hosts. This bot is currently in development and available as a beta version. 

# Features

-Stream music from Soundcloud, remote or local hosts

-Supports local file playback (MP3, WAV, FLAC)

-Search for songs by title or artist and play them directly

-Maintains a song queue for continuous playback

-Playback Controls

-Playlist searches for up to 5 songs and queues them for playback

-Level and Reward System

-Direct Requests lets users send custom requests to the bot owner

-Commands list (?commands)

-PM2 Support

# Prerequisites

Install the latest version of node.js https://nodejs.org/en

# Creating a Discord Bot

1. Go to the Discord Developer Portal https://discord.com/developers/docs/intro
2. Create a New Application
   
   Click "New Application" and give your bot a name. Save Application. 

3. Set Up the Bot

   Go to the "Bot" section in the left sidebar.

   Click "Add Bot" and confirm.

   Under Token, click "Reset Token" to generate your bot's token.

   Save this token securely for later use.

4. Enable Privileged Gateway Intents

   Under "Privileged Gateway Intents," enable the Message Content Intent and Presence Intent.

   
5. Invite the Bot to Your Server

   Go to the "OAuth2" > "URL Generator" section.
   Under Scopes, check bot.

   Under Bot Permissions, select the permissions your bot needs (e.g., Read Messages, Send Messages,    Connect, Speak).

   Copy the generated link and use it to invite the bot to your Discord server.

# SoundCloud API

If you already have a SoundCloud Client ID, then skip this step. 

Sign up at the SoundCLoud API Developer Portal to obtain a CLient ID. 
https://developers.soundcloud.com/

If you are unable to sign up for SoundCloud API access, then follow these steps to find a client ID. 

1. Open Firefox, or whichever browser you use, and navigate to the Soundcloud website. Search for a song and press play. In the browser, click the settings tab and choose More Tools/Web Developer Tools.

2. Next click the Network tab and look through the POST requests until you find the client ID. Copy and paste the ID into the specified field in the index.js script.

# Install Dependencies

Install Required Libraries: Run the following command to install all required dependencies:

    npm install
    npm install discord.js
    npm install @discordjs/voice
    npm install play-dl

Install pm2 if you wish to run as a process. Not required. 

     npm install -g pm2
     
# Setting up script

Find line 26 and enter your SoundCloud Client ID

Find line 54 and set your music dir path. Default path is .Music (folder inside your bot folder)

Find line 55 and enter your Discord owner ID. (Needed for bot-owner messages.)

Find line 504 and enter your Discord Bot Token.

# Run the Bot

   cd into your bot directory
   
   Run the bot using:

    node index.js

Check your Discord server to ensure the bot is online.

If using pm2, run bot using:

     pm2 start index.js

# Playing Music

When searching for music, BeatBox will search the local, or remote directory first. If the requested song isn't found, BeatBox will search SoundCloud. Songs in the local/remote directory should list artist and name in the file name. Artist and song can be seperated with a space or hyphen. When searching for a specific song, users will use artist name followed by a space and song title. See example below...

Usage:

     ?play The Beatles Helter Skelter

# Commands

**?play** 

  Plays a song by searching YouTube, SoundCloud, or the local directory.
  If the bot is not in a voice channel, it joins automatically.

**?skip**

  Skips the current song and plays the next one in the queue.
  If no songs are in the queue, the bot stops playback.

**?stop**

  Stops playback and clears the queue.
  Leaves the voice channel after stopping.

**?leave**

  Disconnects the bot from the voice channel.
  Clears the queue to ensure no lingering playback.

**?playlist** 

   Searches for up to 5 songs by the specified artist and queues them for playback.

**?songlist**

   Lists all available songs in the local music directory. Includes the total number of songs at the top of the list.

**?level**

   Displays the user's current level, experience points (EXP), and "BeatBox Cash" (BBC). Includes the user’s title based on their level.

 **?rewards**
 
   Lists rewards available for the user based on their level. Rewards are displayed with level  requirements and costs in BBC.

 **?add**
 
   Sends a custom message or request directly to the bot owner. Ideal for suggesting new features or reporting issues.

**?register**
    
   Registers the user with their email for reward eligibility. Sends the provided email to the bot owner for future contact.

 **?about**

   Provides a brief description of the bot, including its version and developer.

**?commands**

  Lists all available commands with a short description for each.

**Administrative Commands (Owner Only)**

 **?wipelevel**
 
   Resets all user levels and experience points. Only accessible to the bot owner.
