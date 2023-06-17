import path from 'path';
import LanguageHandler from './LanguageHandler.js';
import consola from 'consola';
import { rename, readdir, rm } from 'fs/promises'
import sharp from 'sharp';
import ConfigHandler from './Confighandler.js';
import { TextChannel } from 'discord.js';

/** Files manager to manage a list of files  */
export default class FileManager {

  type;
  folder;
  files;
  abortedFiles;
  config;

  /**
   * 
   * @param {string} type 
   * @param {ConfigHandler} config 
   */
  constructor(type, config) {
    this.type = type;
    this.files = [];
    this.folder = (type === 'sfw') ? config.SFW_FOLDER : config.NSFW_FOLDER;
    this.abortedFiles = [];
    this.config = config;
  }

  async initializeFolder() {
    try {
      const searchFolder = await this.getDirectories(this.folder);
      this.folder = path.resolve(this.folder, searchFolder[0]);
    } catch (e) {
      // No directory found
      return Promise.reject(e);
    }
  }

  /**
   * @param {LanguageHandler} lang
   * @return {string[]}
   */
  async initializeFiles(lang) {

    const searchFiles = await this.getFiles(this.folder);

    const compressedFiles = [];

    for (const file of searchFiles) {
      const filepath = path.resolve(this.folder, file);

      console.log();
      consola.info(lang.getText('compressInProgress', this.type, file));
      compressedFiles.push(await this.compressFile(filepath));
    }

    for (const compressed of compressedFiles) {
      try {
        const searchFile = path.resolve(this.folder, `${compressed.file.name}-compressed.jpeg`);

        this.files.push({ ...compressed, path: searchFile })
      } catch (e) {
        consola.error(lang.getText('compressionError', compressed))
      }
    }

    return this.files;
  }

  /**
   * Compressing the files with Sharp
   * @param {string} filepath 
   * @returns {sharp.Sharp, Object }
   */
  async compressFile(filepath) {
    const filename = path.parse(path.basename(filepath)).name

    // Search file source
    const source = this.findSource(filename)

    try {
      let compressed = await sharp(filepath).toFormat("jpeg", { mozjpeg: true }).toFile(`${this.folder}\\${filename}-compressed.jpeg`)

      await rm(filepath)
      compressed.name = filename;

      return { file: compressed, source };
    } catch (error) {
      consola.error(`${error}`);
    }
  }

  /**
   * Find source artist
   * @param {string} filename 
   * @returns { string, string }
   */
  findSource(filename) {
    const nameArray = filename.split('-')
    let website = '';
    let artist = '';

    if (nameArray.length > 2) {
      website = nameArray[0].toLowerCase();

      if (website === 'twitter') {
        artist = nameArray[1];
      }

      if (website === 'konachan.com' || website === 'konachan') {
        artist = nameArray[1];
      }
    } else {
      if (nameArray[0] === 'Konachan.com') return { website: '', artist: '' }

      const deletedId = filename.split('__');
      if (deletedId.length === 1) return { website: '', artist: '' }

      const splitedName = deletedId[0].split('drawn_by_');
      artist = splitedName[1].replaceAll('_', ' ');

      website = 'danbooru';
    }

    return { website, artist }
  }

  /**
   * Sending the file to the server's channels
   * @param {Guild} guild - Server to send the file to
   * @param {TextChannel} channel - Channel to send the file to
   */
  async sendFiles(guild, channel, lang) {
    let count = 0;

    console.log();
    consola.info(lang.getText('sending', this.type))

    for (let file of this.files) {
      this.printLoading(this.files, file, count);

      // INFO
      // 🐦  =    twitter
      // 🌐   =    danbooru
      // 🙏  =    konachan
      const websiteIcon = {
        twitter: '🐦',
        danbooru: '🌐',
        konachan: '🙏'
      };

      try {
        if (file.source.website !== '' && file.source.artist !== '') {
          await channel.send({
            content: `${websiteIcon[file.source.website]} Source **${file.source.website}**: \`${file.source.artist}\``,
            files: [file.path]
          });
        } else {
          await channel.send({ files: [file.path] })
        }
      } catch (err) {
        this.abortedFiles.push(file);
      }

      count++;
      this.printLoading(this.files, file, count);
    }

    if (this.abortedFiles.length > 0) {
      await this.sendAbortedFiles(channel, lang, count);
    }

    console.log();
    consola.success(lang.getText('fileSendedSuccessfully', this.files.length, channel.name, guild.name))
  }

  /**
   * Manage aborted files who cannot be sent
   * @param {TextChannel} channel - Discord server text channel
   * @parma {LanguageHandler} lang
   */
  async sendAbortedFiles(channel, lang, count) {
    if (this.abortedFiles.length > 1) consola.error(lang.getText('abortFiles', this.abortedFiles.length))
    if (this.abortedFiles.length === 1) consola.error(lang.getText('abortFile', this.abortedFiles.length))

    for (let aborted of this.abortedFiles) {
      count = 0;
      this.printLoading(this.abortedFiles, aborted, count);

      if (this.type === 'sfw') await rename(aborted.path, this.config.SFW_BIN + '\\' + aborted.name + '.' + aborted.format);
      else if (this.type === 'nsfw') await rename(aborted.path, this.config.NSFW_BIN + '\\' + aborted.name + '.' + aborted.format);
      this.abortedFiles.slice(this.abortedFiles.indexOf(aborted), 1);

      count++;
      this.printLoading(this.abortedFiles, aborted, count);
    }
  }

  /**
   * @param {string} source 
   * @returns {string[]}
   */
  async getDirectories(source) {
    return (await readdir(source, { withFileTypes: true })).filter(dirent => dirent.isDirectory()).map(dirent => dirent.name)
  }

  /**
   * 
   * @param {string} source 
   * @returns {string[]}
   */
  async getFiles(source) {
    return (await readdir(source, { withFileTypes: true })).filter(dirent => !dirent.isDirectory()).map(dirent => dirent.name);
  }

  /**
   * ? Print loading bar
   * @param {Object[]} files - List of files
   * @param {Object} file - Loading file
   * @param {number} count - Counting iterations
   */
  printLoading(files, file, count) {
    let filesize;
    const str = (file.file.size).toString();

    if (file.file.size > 99999 && file.file.size < 1000000) {
      filesize = str.slice(0, -3) + ' Ko';
    } else if (file.file.size > 999999) {
      filesize = str.slice(0, -6) + '.' + str.slice(1, -3) + ' Mo';
    }

    process.stdout.write(`\r\x1b[0m[${'*'.repeat(count)}${' '.repeat(files.length - count)}] ${count}/${files.length}  \x1b[32m${file.file.name}\x1b[89m  \x1b[33m${filesize}\x1b[89m\x1b[0m`)
  }
}