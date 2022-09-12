import dotenv from 'dotenv'
import consola from 'consola';
import { Client, GatewayIntentBits, Guild, TextChannel } from 'discord.js';
import path from 'path';
import { readdir, rm, rename } from 'fs/promises';
import sharp from 'sharp';
import { config } from './config.js'
import getLocale from './languagesHandler.js'
import inquirer from 'inquirer'
import $ from "../package.json" assert {type: "json"}

dotenv.config();

// Discord
const client = new Client({ intents: [GatewayIntentBits.Guilds]});

// Folders
let NSFWFolder, SFWFolder;

// Files
const NSFWFiles = [];
const SFWFiles = [];

// Files who couldn't be uploaded;
const abortedNSFWFiles = [];
const abortedSFWFiles = [];

// Functions
const getDirectories = async source => (await readdir(source, { withFileTypes: true})).filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);
const getFiles = async source => (await readdir(source, { withFileTypes: true})).filter(dirent => !dirent.isDirectory()).map(dirent => dirent.name);

const compressFile = async (filepath, folder) => {
  const file = filepath.split('\\').at(-1);
  const filename = file.split('.')[0];

  try {
    let compressed = await sharp(filepath).toFormat("jpeg", { mozjpeg: true }).toFile(`${folder}\\${filename}-compressed.jpeg`)

    await rm(filepath)
    compressed.name = filename;

    return compressed;
  }catch(error) {
    consola.error(`${error}`);
  }
}

/**
 * ? File initilization + Compression
 * @param {string} mainFolder - Folder to look at
 * @param {string} type - Type of folder (SFW or NSFW)
 */
const initializeFiles = async (mainFolder, type) => {
  const searchFolder = await getDirectories(mainFolder)
  const folder = path.resolve(mainFolder, searchFolder[0]);

  if(type === 'nsfw') NSFWFolder = folder;
  else if(type === 'sfw') SFWFolder = folder;

  const searchFiles = await getFiles(folder)

  const compressedFiles = [];

  for(let file of searchFiles) {
    const filepath = path.resolve(folder, file);

    console.log();
    //consola.info(`[${type}] Compression de ${file}...`);
    consola.info(getLocale('compressInProgress', type, file))
    compressedFiles.push(await compressFile(filepath, folder))
  }

  for(let compressed of compressedFiles) {
    const searchFile = path.resolve(folder, `${compressed.name}-compressed.jpeg`)

    if(type === 'nsfw') NSFWFiles.push({...compressed, path: searchFile});
    else if(type === 'sfw') SFWFiles.push({...compressed, path: searchFile}); 
  }
}

/**
 * ? Error handling if channel is missing
 * @param {Guild} server - Current guild
 * @param {TextChannel} channel - Channel (checking if missing)
 * @param {string} type - Type (SFW / NSFW)
 * @return {boolean} if true, channel is missing, if false channel is existing
 */
const isChannelMissing = (server, channel, type) => {
  if(!channel) {
    consola.error(getLocale('channelIsMissing', type, server.name))
    client.destroy();
    return true;
  }

  return false;
}

/**
 * ? Print loading bar
 * @param {Object[]} files - List of files
 * @param {Object} file - Loading file
 * @param {number} count - Counting iterations
 */
const printLoading = (files, file, count) => {
    let filesize;
    const str = (file.size).toString();

    if(file.size > 99999 && file.size < 1000000) {
      filesize = str.slice(0, -3) + ' Ko';
    }else if(file.size > 999999) {
      filesize = str.slice(0, -6) + '.' + str.slice(1, -3) + ' Mo';
    }

    process.stdout.write(`\r\x1b[0m[${'*'.repeat(count)}${' '.repeat(files.length-count)}] ${count}/${files.length}  \x1b[32m${file.name}\x1b[89m  \x1b[33m${filesize}\x1b[89m\x1b[0m`)
}

/**
 * Sending the file to the server
 * @param {Guild} guild - Server to send the file to
 * @param {TextChannel} channel - Channel to send the file to
 * @param {Object[]} files - Files to send
 * @param {Object[]} abortedFiles - Files who couldn't be uploaded (Timeout)
 */
const sendFiles = async (guild, channel, files, abortedFiles) => {
  const type = (channel.name === config.SFW_NAME) ? 'SFW' : 'NSFW';
  let count = 0;

  console.log();
  consola.info(getLocale('sending', type))
  
  for(let file of files){
    printLoading(files, file, count);

    try {
      await channel.send({ files: [file.path] });
    }catch(err) {
      abortedFiles.push(file);
    }

    count++;
    printLoading(files, file, count);
  }

  if(abortedFiles.length > 0) {
    if(abortedFiles.length > 1) consola.error(getLocale('abortFiles', abortedFiles.length))
    if(abortedFiles.length === 1) consola.error(getLocale('abortFile', abortedFiles.length))

    for(let aborted of abortedFiles) {
      count = 0;
      printLoading(abortedFiles, aborted, count);
      try {
        await channel.send({ files: [aborted.path] });
        abortedFiles.slice(abortedFiles.indexOf(aborted), 1);
      }catch(err) {
        consola.error(getLocale('cantSendFile', aborted.name))

        if(type === 'SFW') await rename(aborted.path, config.SFW_BIN + '\\' + aborted.name + '.' + aborted.format)
        else if(type === 'NSFW') await rename(aborted.path, config.NSFW_BIN + '\\' + aborted.name + '.' + aborted.format)
        abortedFiles.slice(abortedFiles.indexOf(aborted), 1);
      }

      count++;
      printLoading(abortedFiles, aborted, count);
    }
  }

  console.log();
  consola.success(getLocale('fileSendedSuccessfully', files.length, channel.name, guild.name))
}

export const sendTheSauce = async () => {
  // NSFW 😈
  if(config.ignoredFolder !== 'NSFW') await initializeFiles(config.NSFW_FOLDER, 'nsfw');
  
  // SFW 😇
  if(config.ignoredFolder !== 'SFW') await initializeFiles(config.SFW_FOLDER, 'sfw');

  // Find all guilds
  const guilds =  client.guilds.cache.map(g => g.id);

  // Send them to designated channels
  for(let gid of guilds) {
    if(config.ignoredGuilds.includes(gid)) continue;

    const guild = client.guilds.cache.get(gid);

    const sfwChannel = guild.channels.cache.find(channel => channel.name === config.SFW_NAME);
    const nsfwChannel = guild.channels.cache.find(channel => channel.name === config.NSFW_NAME);

    if(isChannelMissing(guild, sfwChannel, 'SFW') || isChannelMissing(guild, nsfwChannel, 'NSFW')) return;

    if(config.ignoredFolder !== 'SFW') await sendFiles(guild, sfwChannel, SFWFiles, abortedSFWFiles);

    if(config.ignoredFolder !== 'NSFW') await sendFiles(guild, nsfwChannel, NSFWFiles, abortedNSFWFiles);
  }

  // Delete folders
  if(config.ignoredFolder !== 'SFW') {
    await rm(SFWFolder, { recursive: true, force: true})
    consola.success(getLocale('folderDeletedSuccessfully', 'SFW', SFWFolder.split('\\').at(-1)))
  }
  
  if(config.ignoredFolder !== 'NSFW') {
    await rm(NSFWFolder, { recursive: true, force: true})
    consola.success(getLocale('folderDeletedSuccessfully', 'NSFW', NSFWFolder.split('\\').at(-1)))
  }

  // See you next time ❤
  consola.success(getLocale('finished'))
  client.destroy();
}

const startMenu = async () => {
  console.log();
  const allGuildsAvailable = client.guilds.cache.map(g => new Object({name: g.name, id: g.id})).filter(g => !config.ignoredGuilds.includes(g.id))

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: getLocale('helloAction'),
      choices: [getLocale('start', allGuildsAvailable.map(g => g.name).join(', ')), 
      getLocale('editIgnoreFolder') + (config.ignoredFolder !== '' ? ` \x1b[34m[${getLocale('confirmIgnored', config.ignoredFolder)}]\x1b[0m` : ''), 
      getLocale('quit')]
    }
  ])

  // Send images
  if(answers.action === getLocale('start', allGuildsAvailable.map(g => g.name).join(', '))) {
    await confirm();
  }

  // Ignore folder
  if(answers.action === getLocale('editIgnoreFolder') || answers.action === getLocale('editIgnoreFolder') + ` \x1b[34m[${getLocale('confirmIgnored', config.ignoredFolder)}]\x1b[0m`) {
    await ignoreFolderMenu();
  }

  // Quit
  if(answers.action === getLocale('quit')) {
    console.log('\x1b[33m'+getLocale('goodBye')+'\x1b[0m');
    client.destroy();
  }
}

const confirm = async () => {
  const searchFolderNSFW = await getDirectories(config.NSFW_FOLDER)
  const folderNSFW = path.resolve(config.NSFW_FOLDER, searchFolderNSFW[0]);

  const searchFolderSFW = await getDirectories(config.SFW_FOLDER)
  const folderSFW = path.resolve(config.SFW_FOLDER, searchFolderSFW[0]);

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'confirm',
      message: getLocale('confirmStart', (config.ignoredFolder !== 'SFW') ? `\x1b[36m${folderSFW}\x1b[0m` : getLocale('none'), (config.ignoredFolder !== 'NSFW') ? `\x1b[31m${folderNSFW}\x1b[0m` : getLocale('none')),
      choices: [getLocale('yes'), getLocale('no')]
    }
  ])

  console.log();

  if(answers.confirm === getLocale('yes')) await sendTheSauce();
  else startMenu()
}

const ignoreFolderMenu = async () => {
  const answers = await inquirer.prompt({
    type: 'list',
    name: 'folder',
    title: getLocale('editIgnoreFolderText'),
    choices: ['SFW', 'NSFW']
  })

  config.ignoredFolder = answers.folder;

  startMenu();
}

// ? Listener, client is ON and we directly sending everything
client.on('ready', async () => {
  console.log('\n\x1b[34m'+getLocale('helloWorld', client.user.tag, $.version)+'\x1b[0m')

  client.user.setPresence({ activities: [{  name: 'Roi de la glandouille' }], status: 'dnd'})

  startMenu();
});


client.login(process.env.TOKEN);