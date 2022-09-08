import fr from "../locales/fr.json" assert {type: "json"}
import en from "../locales/en.json" assert {type: "json"}
import config from "../src/config.js";

let strings = {
  fr: fr,
  en: en
}

const getLocale = (string, ...vars) => {
  let locale = strings[config.LANGUAGE][string]
  let count = 0;

  return locale.split(/(\%\w+?\%)/g).map(v => {
    if(v === '%VAR%') return v.replace('%VAR%', vars[count++])
    return v;
  }).join('')
}

export default getLocale;