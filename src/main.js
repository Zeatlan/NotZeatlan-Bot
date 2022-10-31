import dotenv from 'dotenv'
import { Client, GatewayIntentBits  } from 'discord.js'
import ConfigHandler from './Classes/ConfigHandler.js'
import LanguageHandler from './Classes/LanguageHandler.js'
import FileManager from './Classes/FileManager.js'
import { readFile, rm } from 'fs/promises'
import { mainMenu, confirm } from './menus.js'

// **************************
// *      Config part       *
// **************************
dotenv.config();
const client = new Client({ intents: [ GatewayIntentBits.Guilds ]});
const config = await ConfigHandler.init();
const lang = await LanguageHandler.initTranslations(config.LANGUAGE);

const $ = JSON.parse(await readFile('package.json'))


// **************************
// *      Discord part      *
// **************************
client.once('ready', async () => {
  console.log(`\n\x1b[34m${lang.getText('helloWorld', client.user.tag, $.version)}\x1b[0m`);
  client.user.setPresence({ activities: [{  name: 'Roi de la glandouille' }], status: 'dnd'});

  mainMenu(client, config, lang);
});

client.login(process.env.TOKEN)

/**
 * ? Error handling if channel is missing
 * @param {Guild} server - Current guild
 * @param {TextChannel} channel - Channel (checking if missing)
 * @param {string} type - Type (SFW / NSFW)
 * @return {boolean} if true, channel is missing, if false channel is existing
 */
const isChannelMissing = (server, channel, type) => {
  if(!channel) {
    consola.error(lang.getText('channelIsMissing', type, server.name))
    client.destroy();
    return true;
  }

  return false;
}


// **************************
// *       Files part       *
// **************************
/**
 * First initialization of the folders before confirmation
 * @param {Client} client - Discord Client
 * @param {ConfigHandler} config 
 * @param {LanguageHandler} lang 
 */
export const initFiles = async (client, config, lang) => {
  let sfw, nsfw;
  if(config.ignoredFolder !== 'SFW') {
    sfw = new FileManager('sfw', config);
    await sfw.initializeFolder().catch(e => {
      consola.error(e);
      return Promise.resolve(mainMenu(client, config, lang))
    })
  }

  if(config.ignoredFolder !== 'NSFW') {
    nsfw = new FileManager('nsfw', config);
    await nsfw.initializeFolder().catch(async (e) => {
      consola.error(e);
      return Promise.resolve(mainMenu(client, config, lang))
    });
  }

  await confirm(client, config, lang, sfw, nsfw)
}

/**
 * Send images then delete folder
 * @param {FileManager} sfw 
 * @param {FileManager} nsfw 
 * @returns 
 */
export const preparingFiles = async (sfw, nsfw) => {
  if(config.ignoredFolder !== 'SFW') {
    await sfw.initializeFiles(lang);
  }

  if(config.ignoredFolder !== 'NSFW') {
    await nsfw.initializeFiles(lang);
  }

  // Find all guilds
  const guilds =  client.guilds.cache.map(g => g.id);

  // Send them to designated channels
  for(let gid of guilds) {
    if(config.ignoredGuilds.includes(gid)) continue;

    const guild = client.guilds.cache.get(gid);

    const sfwChannel = guild.channels.cache.find(channel => channel.name === config.SFW_NAME);
    const nsfwChannel = guild.channels.cache.find(channel => channel.name === config.NSFW_NAME);

    if(isChannelMissing(guild, sfwChannel, 'SFW') || isChannelMissing(guild, nsfwChannel, 'NSFW')) return;

    if(config.ignoredFolder !== 'SFW') await sfw.sendFiles(guild, sfwChannel, lang);

    if(config.ignoredFolder !== 'NSFW') await nsfw.sendFiles(guild, nsfwChannel, lang);
  }

  // Delete folders
  if(config.ignoredFolder !== 'SFW') {
    await rm(sfw.folder, { recursive: true, force: true })
    consola.success(lang.getText('folderDeletedSuccessfully', 'SFW', sfw.folder.split('\\').at(-1)))
  }
  
  if(config.ignoredFolder !== 'NSFW') {
    await rm(nsfw.folder, { recursive: true, force: true })
    consola.success(lang.getText('folderDeletedSuccessfully', 'NSFW', nsfw.folder.split('\\').at(-1)))
  }

  // See you next time ❤
  consola.success(lang.getText('finished'))
  process.exit();
}