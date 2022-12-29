export const command = {
  name: "ping",
  description: "Ping Me!",

  async execute( interaction ) {
    let sent = await interaction.reply({
      content: `Pong!`,
      fetchReply: true,
    });
    try {
      sent.edit(`Pong! | Heartbeat : **${interaction.client.ws.ping}ms** | Roundtrip latency : **${sent.createdTimestamp - interaction.createdTimestamp}ms**.`);
    } catch (e) {
      console.error(e);
     }
  }
}