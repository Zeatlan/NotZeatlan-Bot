import { readdir, readFile } from 'fs/promises';
import path from 'path';

export default class LanguageHandler {

  language;
  languagePacks;

  /**
   * 
   * @param {string} lang - Language
   * @param {Object} languagePacks
   */
  constructor(lang, languagePacks) {
    this.language = lang;
    this.languagePacks = languagePacks;
  }

  static async initTranslations(lang) {
    this.language = lang;
    
    const files = await readdir('locales/');

    const lPack = {}

    for(const file of files) {
      const key = file.split('.')[0];
      Object.assign(lPack, { [key]: JSON.parse(await readFile(path.join('locales', file))) })
    }

    return new LanguageHandler(this.language, lPack);
  }

  getText(string, ...vars) {
    let sentence = this.languagePacks[this.language][string];
    let count = 0;

    return sentence.split(/(\%\w+?\%)/g).map(v => {
      if(v === '%VAR%') return v.replace('%VAR%', vars[count++]);
      return v;
    }).join('');
  }
}