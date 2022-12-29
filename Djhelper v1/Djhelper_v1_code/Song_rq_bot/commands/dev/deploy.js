import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
import config from "../../config.js";
let {devAccessIds} = config;

export const command = {
    name: "deploy",
    description: "Deploy commands",
    isDevCmd: true,
    permissions: [],
    args: true,
    async execute(message) {

        if (!devAccessIds.includes(message.author.id)) return;

        let sent = await message.reply({ content: `Working On It...`, });
        if (message.channel.type === 'DM') sent.edit({ content: "You can't deploy commands in DM.", });

        let args = message.content
            .slice("!".length)
            .trim().split(/ +|\n/);

        args.shift();

        let arg0 = args[0] || "null";
        let arg1 = args[1] || "guild";

        let slashCommandsFolderPath = path.join(__dirname, "../../slashCommands");

        let slashCommandSubFolders = fs.readdirSync(slashCommandsFolderPath);
            let slashCommands = [];
            for(const subFolder of slashCommandSubFolders) {
                let slashCommandFiles = fs.readdirSync(path.join(slashCommandsFolderPath , subFolder));
                for(const file of slashCommandFiles) {
                        let slashPath = '../../slashCommands/'+ subFolder +'/'+ file;
                        const { command } = await import(slashPath);
                        slashCommands.push(command);
                    }
                   
            }

        const deploySlashes = (subCmd, deployScope) => {

            if (subCmd == "clear") {
                if (deployScope.toLowerCase() == "global") {
                    message.client.application.commands.set([]).then(() => {
                        sent.edit("Cleared all slash commands!")
                    }
                    )
                        .catch(e => {
                            sent.edit("Error ocurred");
                            console.error(e);
                        })
                } else {
                    message.guild.commands.set([])
                        .then(() => {
                            sent.edit(`Cleared all slash commands of **this server**`)
                        })
                        .catch(console.error);
                }
            } else if (subCmd == "create") {
                if (deployScope.toLowerCase() == "global") {
                    for (const command of slashCommands) {
                        if (!command) continue;
                        message.client.application.commands.create(command)
                    }
                    sent.edit("created all slash commands!")
                } else {
                    let guildSlashCmds = [];
                    for (const command of slashCommands) {
                        if (!command) continue;
                        guildSlashCmds.push(command)
                    }
                    message.guild.commands.set(guildSlashCmds)
                        .then(() => {
                            sent.edit(`created all slash commands for **this guild**`);
                        })
                        .catch(console.error);
                }
            } else if (subCmd == "redeploy") {
                if (deployScope.toLowerCase() == "global") {
                    message.client.application.commands.set([])
                        .then(() => {
                            for (const command of slashCommands) {
                                if (!command) continue;
                                message.client.application.commands.create(command)
                            }
                            sent.edit("redeployed all slash commands!")
                        })
                } else {
                    message.guild.commands.set([])
                        .then(() => {
                            let guildSlashCmds = [];
                            for (const command of slashCommands) {
                                if (!command) continue;
                                guildSlashCmds.push(command)
                            }
                            message.guild.commands.set(guildSlashCmds)
                                .then(() => {
                                    sent.edit(`created all slash commands for **this guild**`);
                                })
                                .catch(console.error);
                        })
                        .catch(console.error);
                }
            } else {
                sent.edit("Please specify a subcommand\n> clear : Clear all slash commands\n> create : Create all slash commands\n> redeploy : redeploy all slash commands\n\nexample: !deploy redeploy")
            }
        }

        deploySlashes(arg0, arg1);


    }
}