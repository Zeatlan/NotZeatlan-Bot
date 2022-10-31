import { Client } from 'discord.js';
import ConfigHandler from './Classes/Confighandler.js';
import LanguageHandler from './Classes/LanguageHandler.js';
import MenuManager from './Classes/MenuManager.js'
import { initFiles, preparingFiles } from './main.js'
import consola from 'consola';

/**
 * MAIN MENU
 * @param {Client} client 
 * @param {ConfigHandler} config 
 * @param {LanguageHandler} lang 
 */
export const mainMenu = async (client, config, lang) => {
  const allGuildsAvailable = client.guilds.cache.map(g => new Object({name: g.name, id: g.id})).filter(g => !config.ignoredGuilds.includes(g.id))

  const menuChoice = await new MenuManager(
    'list', 
    'main', 
    lang.getText('helloAction'),
    [
      lang.getText('start', `\x1b[35m${allGuildsAvailable.map(g => g.name).join(', ')}\x1b[0m`), 
      lang.getText('edit'),
      lang.getText('editIgnoreFolder') + (config.ignoredFolder !== '' ? ` \x1b[34m[${lang.getText('confirmIgnored', config.ignoredFolder)}]\x1b[0m` : ''), 
      `\x1b[31m${lang.getText('quit')}\x1b[0m`
    ]
  ).handleMenu();

  // Start
  if(menuChoice === lang.getText('start', `\x1b[35m${allGuildsAvailable.map(g => g.name).join(', ')}\x1b[0m`)) await initFiles(client, config, lang);

  // Edit params
  if(menuChoice === lang.getText('edit'))  await menuEdit(client, config, lang);

  // Edit ignore folder
  if(menuChoice === lang.getText('editIgnoreFolder') || menuChoice === lang.getText('editIgnoreFolder') + ` \x1b[34m[${lang.getText('confirmIgnored', config.ignoredFolder)}]\x1b[0m`) {
    await menuIgnoreFolder(client, config, lang);
  }

  // Quit
  if(menuChoice === `\x1b[31m${lang.getText('quit')}\x1b[0m`) {
    console.log('\x1b[33m'+lang.getText('goodBye')+'\x1b[0m');
    client.destroy();
  }
}

/**
 * CONFIRMATION MENU (Before sending)
 * @param {Client} client 
 * @param {ConfigHandler} config 
 * @param {LanguageHandler} lang 
 */
export const confirm = async (client, config, lang, sfw, nsfw) => {

  const confirmation = await new MenuManager(
    'list',
    'confirm',
    lang.getText('confirmStart', (config.ignoredFolder !== 'SFW') ? `\x1b[36m${sfw.folder}\x1b[0m` : lang.getText('none'), (config.ignoredFolder !== 'NSFW') ? `\x1b[31m${nsfw.folder}\x1b[0m` : lang.getText('none')),
    [lang.getText('yes'), lang.getText('no')]
  ).handleMenu();
  console.log();

  if(confirmation === lang.getText('yes')) await preparingFiles(sfw, nsfw);
  else return Promise.resolve(mainMenu(client, config, lang))
}

// **************************
// *        Edit part       *
// **************************
/**
 * EDIT MENU
 * @param {Client} client 
 * @param {ConfigHandler} config 
 * @param {LanguageHandler} lang 
 */
const menuEdit = async (client, config, lang) => { 
  const editChoice = await new MenuManager(
    'list',
    'edit',
    lang.getText('editText'),
    [
      lang.getText('editIgnoredGuilds'),
      lang.getText('editFolders'),
      lang.getText('editBins'),
      lang.getText('editChannels'),
      lang.getText('editLang'),
      `\x1b[31m${lang.getText('backToMenu')}\x1b[0m`
    ]
  ).handleMenu();

  // Edit ignored guilds
  if(editChoice === lang.getText('editIgnoredGuilds')) await menuIgnoredGuilds(client, config, lang);

  // Edit Folders
  if(editChoice === lang.getText('editFolders')) await menuFolders(client, config, lang);

  // Edit Bins
  if(editChoice === lang.getText('editBins')) await menuBins(client, config, lang);

  // Edit Channels
  if(editChoice === lang.getText('editChannels')) await menuChannels(client, config, lang);

  // Edit language
  if(editChoice === lang.getText('editLang')) await menuLanguage(client, config, lang);

  // To main menu
  if(editChoice === `\x1b[31m${lang.getText('backToMenu')}\x1b[0m`) return Promise.resolve(mainMenu(client, config, lang))
}

/**
 * EDIT IGNORED GUILDS
 * @param {Client} client 
 * @param {ConfigHandler} config 
 * @param {LanguageHandler} lang 
 */
const menuIgnoredGuilds = async (client, config, lang) => { 
  let ignoredGuilds = [];

  for(const guildId of config.ignoredGuilds) {
    ignoredGuilds.push({ 
      id: client.guilds.cache.get(guildId).id, 
      name: client.guilds.cache.get(guildId).name 
    })
  }

  const action = await new MenuManager(
    'list',
    'action',
    lang.getText('editIgnoredGuildsText'),
    [
      `\x1b[32m${lang.getText('editIgnoredGuildsAdd')}\x1b[0m`,
      ...ignoredGuilds.map(g => g.name),
      `\x1b[31m${lang.getText('backToEdit')}\x1b[0m`
    ]
  ).handleMenu();

  // Add new ignored
  if(action === `\x1b[32m${lang.getText('editIgnoredGuildsAdd')}\x1b[0m`) await menuAddIgnoredGuild(client, config, lang)
  
  // Back to edit
  if(action === `\x1b[31m${lang.getText('backToEdit')}\x1b[0m`) return Promise.resolve(menuEdit(client, config, lang));
  
  const findGuild = ignoredGuilds.filter(g => g.name === action);

  // Delete guild from ignored
  if(findGuild) {
    const idx = config.ignoredGuilds.indexOf(findGuild.id);
    config.ignoredGuilds.splice(idx, 1);
    await config.parseJson(config);
  }

  // return Promise.resolve(menuIgnoredGuilds(client, config, lang));

}


/**
 * ADD IGNORED GUILDS
 * @param {Client} client 
 * @param {ConfigHandler} config 
 * @param {LanguageHandler} lang 
 */
const menuAddIgnoredGuild = async (client, config, lang) => { 
  const add = await new MenuManager(
    'input',
    'add',
    lang.getText('addIgnoredGuildText'),
  ).handleMenu()

  if(add !== ''){
    const guild = client.guilds.cache.find(g => g.name.toLowerCase() === add.toLowerCase());

    if(guild) {
      config.ignoredGuilds.push(guild.id);
      await config.parseJson(config);
    }else {
      consola.error(lang.getText('addIgnoredGuildError', add))
    }
  }
  return Promise.resolve(menuIgnoredGuilds(client, config, lang));
}


/**
 * EDIT FOLDERS
 * @param {Client} client 
 * @param {ConfigHandler} config 
 * @param {LanguageHandler} lang 
 */
const menuFolders = async (client, config, lang) => {
  const sfwFolder = await new MenuManager(
    'input',
    'sfw',
    lang.getText('editFoldersTextSFW'),
    [],
    config.SFW_FOLDER
  ).handleMenu();

  if(sfwFolder !== '') {
    config.SFW_FOLDER = sfwFolder.replace(/\\/g, '\\');
  }

  const nsfwFolder = await new MenuManager(
    'input',
    'nsfw',
    lang.getText('editFoldersTextNSFW'),
    [],
    config.NSFW_FOLDER
  ).handleMenu();

  if(nsfwFolder !== '') {
    config.NSFW_FOLDER = nsfwFolder.replace(/\\/g, '\\');
  }

  await config.parseJson(config);
  return Promise.resolve(menuEdit(client, config, lang));
}

/**
 * EDIT BINS
 * @param {Client} client 
 * @param {ConfigHandler} config 
 * @param {LanguageHandler} lang 
 */
const menuBins = async (client, config, lang) => {
  const sfwBin = await new MenuManager(
    'input',
    'sfw',
    lang.getText('editBinsTextSFW'),
    [],
    config.SFW_BIN
  ).handleMenu();

  if(sfwBin !== '') {
    config.SFW_BIN = sfwBin.replace(/\\/g, '\\');
  }

  const nsfwBin = await new MenuManager(
    'input',
    'nsfw',
    lang.getText('editBinsTextNSFW'),
    [],
    config.NSFW_FOLDER
  ).handleMenu();

  if(nsfwBin !== '') {
    config.NSFW_BIN = nsfwBin.replace(/\\/g, '\\');
  }

  await config.parseJson(config);
  return Promise.resolve(menuEdit(client, config, lang));
}

/**
 * EDIT CHANNELS
 * @param {Client} client 
 * @param {ConfigHandler} config 
 * @param {LanguageHandler} lang 
 */
const menuChannels = async (client, config, lang) => {
  const sfwChannel = await new MenuManager(
    'input',
    'sfw',
    lang.getText('editChannelsTextSFW'),
    [],
    config.SFW_NAME
  ).handleMenu();

  if(sfwChannel !== '') {
    config.SFW_NAME = sfwChannel.toLowerCase().trim();
  }

  const nsfwChannel = await new MenuManager(
    'input',
    'nsfw',
    lang.getText('editChannelsTextNSFW'),
    [],
    config.NSFW_NAME
  ).handleMenu();

  if(nsfwChannel !== '') {
    config.NSFW_NAME = nsfwChannel.toLowerCase().trim();
  }

  await config.parseJson(config);
  return Promise.resolve(menuEdit(client, config, lang));
}

/**
 * EDIT MENU LANGUAGE
 * @param {Client} client 
 * @param {ConfigHandler} config 
 * @param {LanguageHandler} lang 
 */
const menuLanguage = async (client, config, lang) => {
  const langChoice = await new MenuManager(
    'list',
    'lang',
    lang.getText('editLang'),
    ['fr', 'en']
  ).handleMenu();

  lang.language = langChoice;
  
  config.LANGUAGE = langChoice;
  await config.parseJson(config);

  return Promise.resolve(menuEdit(client, config, lang));
}

// **************************
// *       Ignore part      *
// **************************

/**
 * IGNORE FOLDER MENU
 * @param {Client} client 
 * @param {ConfigHandler} config 
 * @param {LanguageHandler} lang 
 */
const menuIgnoreFolder = async (client, config, lang) => {
  const ignoreChoice = await new MenuManager(
    'list',
    'ignore',
    lang.getText('editIgnoreFolderText'),
    ['SFW', 'NSFW', lang.getText('dontIgnore')]
  ).handleMenu();

  if(ignoreChoice !== lang.getText('dontIgnore')) config.ignoredFolder = ignoreChoice;
  else config.ignoredFolder = '';

  await config.parseJson(config);
  return Promise.resolve(mainMenu(client, config, lang));
}