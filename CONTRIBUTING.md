# Contributing

## Setup dev env

1. Install [nvm](https://github.com/nvm-sh/nvm)
2. Install node `nvm install node`
3. Install yarn `npm install -g yarn`
4. Install docker and docker-compose ( see your distro )

## Setup discord app

1. go to `https://discord.com/developers/applications`
2. create new application
3. add a bot to the application
4. Create a token for it, and keep secret
5. tick on Message Content Intent on the bot property pages
6. create an inviation link ( go to OAuth2 ), click scope bot. Copy the URL and replace the end of it by `permissions=122943450112&scope=bot%20applications.commands`

## Prepare for coding

1. Do `yarn` in the repository
2. Create .env file with the copy of .env.sample, and fit the BOT_TOKEN property
3. (optional) Edit code

## Test code

3. In your console, do `.env && export BOT_TOKEN=$BOT_TOKEN` to give the TOKEN to bot
4. Run `yarn watch`. The bot will start, and restart at every change of file

## Deploy your code in a machine

1. copy your work in a target machine
2. run `docker-compose build`
3. run `docker-compose up -d`
4. stop with `docker-compose down`
