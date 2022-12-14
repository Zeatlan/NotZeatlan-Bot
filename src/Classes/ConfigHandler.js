import { readFile, writeFile } from 'fs/promises'

/** Handle all configs */
export default class ConfigHandler {
  ignoredGuilds;
  ignoredFolder;

  SFW_FOLDER;
  NSFW_FOLDER;

  SFW_BIN;
  NSFW_BIN;

  SFW_NAME;
  NSFW_NAME;

  LANGUAGE;

  /**
   * 
   * @param {string[]} ignoredGuilds - Array of guild ID
   * @param {string} ignoredFolder 
   * @param {string} sfwFolder 
   * @param {string} nsfwFolder 
   * @param {string} sfwBin 
   * @param {string} nsfwBin 
   * @param {string} sfwName - SFW Channel name
   * @param {string} nsfwName - NSFW Channel name
   * @param {string} lang 
   */
  constructor(ignoredGuilds, ignoredFolder, sfwFolder, nsfwFolder, sfwBin, nsfwBin, sfwName, nsfwName, lang) {
    this.ignoredGuilds = ignoredGuilds;
    this.ignoredFolder = ignoredFolder;
    this.SFW_FOLDER = sfwFolder;
    this.NSFW_FOLDER = nsfwFolder;
    this.SFW_BIN = sfwBin;
    this.NSFW_BIN = nsfwBin;
    this.SFW_NAME = sfwName;
    this.NSFW_NAME = nsfwName;
    this.LANGUAGE = lang;
  }

  static async init() {
    try {
      const data = JSON.parse(await readFile('./src/config.json'));
      this.ignoredGuilds = data.ignoredGuilds;
      this.ignoredFolder = data.ignoredFolder;
      this.SFW_FOLDER = data.SFW_FOLDER;
      this.NSFW_FOLDER = data.NSFW_FOLDER;
      this.SFW_BIN = data.SFW_BIN;
      this.NSFW_BIN = data.NSFW_BIN;
      this.SFW_NAME = data.SFW_NAME;
      this.NSFW_NAME = data.NSFW_NAME;
      this.LANGUAGE = data.LANGUAGE;
    }catch(e) {
      console.error(e);
    }

    return new ConfigHandler(this.ignoredGuilds, this.ignoredFolder, this.SFW_FOLDER, this.NSFW_FOLDER, this.SFW_BIN, this.NSFW_BIN, this.SFW_NAME, this.NSFW_NAME, this.LANGUAGE)
  }

  /**
   * Update config.json
   * @param {Object} data 
   */
  async parseJson(data) {
    writeFile('./src/config.json', JSON.stringify(data));
    this.editConfig(data);
  }

  editConfig(data) {
    this.ignoredGuilds = data.ignoredGuilds;
    this.ignoredFolder = data.ignoredFolder;
    this.SFW_FOLDER = data.SFW_FOLDER;
    this.NSFW_FOLDER = data.NSFW_FOLDER;
    this.SFW_BIN = data.SFW_BIN;
    this.NSFW_BIN = data.NSFW_BIN;
    this.SFW_NAME = data.SFW_NAME;
    this.NSFW_NAME = data.NSFW_NAME;
    this.LANGUAGE = data.LANGUAGE;
  }
}