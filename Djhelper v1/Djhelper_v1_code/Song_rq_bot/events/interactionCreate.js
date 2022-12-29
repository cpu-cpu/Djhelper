import config from '../config.js';
const { devAccessIds } = config;
import { approveSong, denySong } from '../interactionHandlers/button.js';
export const event = {
  name: 'interactionCreate',
  async execute(interaction) {

    if(interaction.isButton()){
      if(interaction.customId == "approve"){
        await approveSong(interaction);
      }
      if(interaction.customId == "deny"){
        await denySong(interaction);
      }

      return;
    }

    const command = interaction.client.slashCommands.get(interaction.commandName);

    if (!interaction.isCommand()) return;

    if (!command) return;
    if(command.permissions && !command.permissions.every(p => interaction.member.permissions.toArray().includes(p)) /*&& !devAccessIds.includes(interaction.user.id)*/) return interaction.reply({
      content: 'You do not have permission to use this command.',
      ephemeral: true
    });
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if(interaction.replied || interaction.deferred) {
        await interaction.editReply({ content: 'There was an error while executing this command!', ephemeral: true });
      }else{
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
      }
    }
  },
};