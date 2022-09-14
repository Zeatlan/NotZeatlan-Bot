# NotZeatlan Bot

NotZeatlan Bot is a Discord bot created with [DiscordJS](https://github.com/discordjs/discord.js/). His main (and only) purpose is to post images on designated Discord's channels automatically.

This bot was not intended to be used by others than me, but feel free to use it if you want.

## Installation
Just install the packages with
```
npm install
```

Then create a `.env` file like this :
```
TOKEN=YOUR_DISCORD_BOT_TOKEN
```

## Usage
* Invite the discord bot on your server.

* If you have multiple server and you don't want it to post your images everywhere just put the guild ID to ignore in the `ignoredGuilds` variables.

* You can edit `config.json` directly in the CLI.
  * `SFW_FOLDER` and `NSFW_FOLDER` are where the bot will look for images.

  * `SFW_BIN` and `NSFW_BIN` are where the files who couldn't be uploaded will be placed. (Instead of deleting them)

  * `SFW_NAME` and `NSFW_NAME` are the names of your respective discord channels.

  * `LANGUAGE` to change the language of the bot.

* If you just want to send SFW or NSFW images, you can just ignore one of these.

And... that's it ! Now, when you want to upload automatically just run `npm run start` and send your images. 😎

## Important
**This project was created for personal purposes**, you can use it if you want, but this wasn't intended to be used by anyone else than me !

Just note that your folder's architecture should look like :

```
📂 (N)SFW FOLDER
|
└─── 📂 0000
|         🖼️ image.jpg
|         🖼️ image2.jpg
|         🖼️ image3.jpg
|
└─── 📂 0001
|         🖼️ image.jpg
|         🖼️ image2.jpg
|         🖼️ image3.jpg
|
└─── 📂 0002
|         🖼️ ...
|         🖼️ ...
|         🖼️ ...
|
└─── 📂 ..
```

The bot will look in the first folder he find (In this example, he will be looking into the folder named `📂 0000`).

> 📂 The folder names are not important for this to work.

---
### ⚠️ CAREFUL, THE BOT WILL DELETE THE FOLDER (in this example, `0000`) WHEN HE HAS FINISHED HIS TASK ⚠️
---

## Licence
[MIT](https://choosealicense.com/licenses/mit/)
