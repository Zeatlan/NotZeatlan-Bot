import {fileURLToPath} from 'url';
import path from 'path';

// Path initialization
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// * CONFIG
const config = {
  // Put id guild to ignore it
  ignoredGuilds: ['868516388883554325'],
  
  // Folders location
  SFW_FOLDER: path.resolve(__dirname, '../../../../Pictures/[FAE]ToSend/SFW/'),
  NSFW_FOLDER: path.resolve(__dirname, '../../../../Pictures/[FAE]ToSend/NSFW/'),

  // Bins 
  SFW_BIN: path.resolve(__dirname, '../../../../Pictures/[FAE]ToSend/bin/sfw'),
  NSFW_BIN: path.resolve(__dirname, '../../../../Pictures/[FAE]ToSend/bin/nsfw'),

  // Channels names
  SFW_NAME: 'sfw',
  NSFW_NAME: 'nsfw-ecchi',

  // Choose console language
  // Availables : fr | en
  LANGUAGE: 'en',
}

export default config;