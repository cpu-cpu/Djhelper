import config from "../config.js";
import { Collection } from "discord.js";

export const event  = {
	name: 'messageCreate',
	execute(message) {
    if(message.author.bot) return;
    if(!message.content.toLowerCase().startsWith(config.prefix)) return;

    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = message.client.commands.get(commandName)
      || message.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName)); // Check for aliases

    if (!command) return;

    if (command.permissions?.length > 0) {
      const authorPerms = message.channel.permissionsFor(message.author);
      if (!authorPerms || !authorPerms.has(command.permissions)) {
        return message.reply('You can not do this!');
      }
    }

    //check cooldown
    if (!message.client.cooldowns.has(command.name)) {
      message.client.cooldowns.set(command.name, new Collection());
    }

    const now = Date.now();
    const timestamps = message.client.cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 0) * 1000;

    if (timestamps.has(message.author.id)) {
      const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        return message.reply(`Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
      }
    }

    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

    if (command.args && !args.length) {
      let reply = `You didn't provide any arguments, ${message.author}!`;

      if (command.usage) {
        reply += `\nThe proper usage would be: \`${config.prefix}${command.name} ${command.usage}\``;
      }

      return message.channel.send(reply);
    }

    try {
      command.execute(message, args, commandName, message.client);
    } catch (error) {
      console.error(error);
      message.reply('There was an error trying to execute that command!');
    }
	},
};