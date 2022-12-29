export const command = {
  name: 'ping',
  description: 'Ping!',
  myExtraPerms:['VIEW_CHANNEL', 'SEND_MESSAGES'],
  permissions: [],
  args: false,
  async execute(message) {
    message.channel.send('Pong. 🎉');
  },
};