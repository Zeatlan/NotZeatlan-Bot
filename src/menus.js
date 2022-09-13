import { Client } from 'discord.js';
import ConfigHandler from './Classes/Confighandler.js';
import LanguageHandler from './Classes/LanguageHandler.js';
import MenuManager from './Classes/MenuManager.js'
import { initFiles, preparingFiles } from './main.js'

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
      lang.getText('start', allGuildsAvailable.map(g => g.name).join(', ')), 
      lang.getText('edit'),
      lang.getText('editIgnoreFolder') + (config.ignoredFolder !== '' ? ` \x1b[34m[${lang.getText('confirmIgnored', config.ignoredFolder)}]\x1b[0m` : ''), 
      lang.getText('quit')
    ]
  ).handleMenu();

  // Start
  if(menuChoice === lang.getText('start', allGuildsAvailable.map(g => g.name).join(', '))) await initFiles(client, config, lang);

  // Edit params
  if(menuChoice === lang.getText('edit'))  await menuEdit(client, config, lang);

  // Edit ignore folder
  if(menuChoice === lang.getText('editIgnoreFolder') || menuChoice === lang.getText('editIgnoreFolder') + ` \x1b[34m[${lang.getText('confirmIgnored', config.ignoredFolder)}]\x1b[0m`) {
    await menuIgnoreFolder(client, config, lang);
  }

  // Quit
  if(menuChoice === lang.getText('quit')) {
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
  else mainMenu(client, config, lang)
}

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
      lang.getText('editFolders'),
      lang.getText('editBins'),
      lang.getText('editChannels'),
      lang.getText('editLang'),
      lang.getText('backToMenu')
    ]
  ).handleMenu();

  // Edit Folders
  if(editChoice === lang.getText('editFolders')) await menuFolders(client, config, lang);

  // Edit Bins
  if(editChoice === lang.getText('editBins')) await menuBins(client, config, lang);

  // Edit Channels
  if(editChoice === lang.getText('editChannels')) await menuChannels(client, config, lang);

  // Edit language
  if(editChoice === lang.getText('editLang')) await menuLanguage(client, config, lang);

  // To main menu
  if(editChoice === lang.getText('backToMenu')) mainMenu(client, config, lang);
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
    lang.getText('editFoldersTextSFW')
  ).handleMenu();

  if(sfwFolder !== '') {
    config.SFW_FOLDER = sfwFolder.replace(/\\/g, '\\');
  }

  const nsfwFolder = await new MenuManager(
    'input',
    'nsfw',
    lang.getText('editFoldersTextNSFW')
  ).handleMenu();

  if(nsfwFolder !== '') {
    config.NSFW_FOLDER = nsfwFolder.replace(/\\/g, '\\');
  }

  await config.parseJson(config);
  menuEdit(client, config, lang);
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
    lang.getText('editBinsTextSFW')
  ).handleMenu();

  if(sfwBin !== '') {
    config.SFW_BIN = sfwBin.replace(/\\/g, '\\');
  }

  const nsfwBin = await new MenuManager(
    'input',
    'nsfw',
    lang.getText('editBinsTextNSFW')
  ).handleMenu();

  if(nsfwBin !== '') {
    config.NSFW_BIN = nsfwBin.replace(/\\/g, '\\');
  }

  await config.parseJson(config);
  menuEdit(client, config, lang);
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
    lang.getText('editChannelsTextSFW')
  ).handleMenu();

  if(sfwChannel !== '') {
    config.SFW_NAME = sfwChannel.toLowerCase().trim();
  }

  const nsfwChannel = await new MenuManager(
    'input',
    'nsfw',
    lang.getText('editChannelsTextNSFW')
  ).handleMenu();

  if(nsfwChannel !== '') {
    config.NSFW_NAME = nsfwChannel.toLowerCase().trim();
  }

  await config.parseJson(config);
  menuEdit(client, config, lang);
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

  config.LANGUAGE = langChoice;
  config.parseJson(config);
  lang.language = langChoice;
  menuEdit(client, config, lang);
}

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

  config.parseJson(config);
  mainMenu(client, config, lang);
}