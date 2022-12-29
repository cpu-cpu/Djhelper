import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { config } from 'dotenv';
config();
import fs from 'fs';

const client = new Client({ intents: [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent,
] });

client.commands = new Collection();
client.slashCommands = new Collection();
client.cooldowns = new Collection();

const slashCommandFolders = fs.readdirSync('./slashCommands');

const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const {event} = await import(`./events/${file}`);
  
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

const commandFolders = fs.readdirSync('./commands');
for (const folder of commandFolders) {
  const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const {command} = await import(`./commands/${folder}/${file}`);
    client.commands.set(command.name, command);
  }
}

for (const folder of slashCommandFolders) {
  const commandFiles = fs.readdirSync(`./slashCommands/${folder}`).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const { command } = await import(`./slashCommands/${folder}/${file}`);
    client.slashCommands.set(command.name, command);
  }
}

client.login(process.env.BOT_TOKEN);


process.on("unhandledRejection", (reason, p) => {
  console.log(reason);
  // console.error(` [antiCrash] :: Unhandled Rejection/Catch`);
  // console.log(reason, p);
});
process.on("uncaughtException", (err, origin) => {
  // console.log(" [antiCrash] :: Uncaught Exception/Catch");
  // console.log(err, origin);
});
process.on("uncaughtExceptionMonitor", (err, origin) => {
  // console.log(" [antiCrash] :: Uncaught Exception/Catch (MONITOR)");
  // console.log(err, origin);
});
process.on("multipleResolves", (type, promise, reason) => {
  // console.log(" [antiCrash] :: Multiple Resolves");
  // console.log(type, promise, reason);
});