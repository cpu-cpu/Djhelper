import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { QuickDB } from "quick.db";
const db = new QuickDB();

export const command = {
  name: "request",
  description: "Request songs",
  options: [
    {
      name: "song",
      description: "The song you want to request",
      type: 3,
      required: true,
    },
    {
      name: "message",
      description: "The message you want to send with the request",
      type: 3,
      required: false,
    }
  ],

  async execute(interaction) {
    await interaction.deferReply({});
    let enabled = await db.get(`${interaction.guild.id}_enabled`);

    if (!enabled) {
      return interaction.editReply({
        content: `Requests are currently disabled!`,
        ephemeral: true
      });
    }


    let requestChannel = await db.get(`${interaction.guild.id}_requestChannel`);
    let requestSubmissionChannel = await db.get(`${interaction.guild.id}_submissionChannel`);
    let denialChannelId = await db.get(`${interaction.guild.id}_denialChannel`);
    let refMsg = await db.get(`${interaction.guild.id}_refmsg`);
    let showSubChannel = await db.get(`${interaction.guild.id}_showsubchannel`);
    let pingRole = await db.get(`${interaction.guild.id}_pingRole`);
    let threadEnabled = await db.get(`${interaction.guild.id}_threadEnabled`);

    if (!requestChannel) {
      interaction.editReply({
        content: "Request channel not set. If you are an admin, please use `/config request channel` to set it.",
        ephemeral: true,
      });
      return;
    }

    if (interaction.channel.id != requestChannel) {
      interaction.editReply({
        content: `Please use this command in <#${requestChannel}>`,
        ephemeral: true,
      });
      return;
    }

    if (!requestSubmissionChannel) {
      interaction.editReply({
        content: "There is no submission channel. If you are an admin, please use `/config submission channel` to set it.",
        ephemeral: true,
      });
      return;
    }

    let song = interaction.options.getString("song");
    let message = interaction.options.getString("message");

    let reqEmbed = new EmbedBuilder()
      .setTitle(`${song} - ${interaction.user.tag}`)
      .addFields({
        name: "Song Name",
        value: song,
        inline: true,
      },
        {
          name: "Status",
          value: "Pending",
          inline: true,
        }
      )
      .setDescription(`__**Requested by**__:\nName: ${interaction.user.tag} (<@${interaction.user.id}>)\nId: ${interaction.user.id}`)
      .setColor("#45b3e0")
      .setFooter({
        text: `${interaction.user.id}`
      })
      .setTimestamp();

    if (message) {
      reqEmbed.addFields({
        name: "Message",
        value: message,
      });
    }

    let row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setLabel("Approve")
          .setStyle(ButtonStyle.Success)
          .setCustomId("approve"),
        new ButtonBuilder()
          .setLabel("Deny")
          .setStyle(ButtonStyle.Danger)
          .setCustomId("deny")
      );

    let approvalChannel;
    try {

      approvalChannel = await interaction.client.channels.fetch(requestSubmissionChannel);
      if (!approvalChannel || approvalChannel.type !== 0) {
        return interaction.editReply({
          content: "There is no submission channel. If you are an admin, please use `/config submission channel` to set it.",
          ephemeral: true,
        });
      }

      let sent = await approvalChannel.send({
        ...pingRole ? { content: `<@&${pingRole}>` } : {},
        embeds: [reqEmbed],
        components: [row],
      });

      await interaction.editReply({
        content: `Your request has been sent${showSubChannel ? ` to ${approvalChannel}` : ''}!${refMsg ? `\nRefer message: https://discord.com/channels/${interaction.guild.id}/${requestSubmissionChannel}/${sent.id}` : ``}`,
      });

      setTimeout(async () => {
        try {
          let sentEmbed = sent.embeds[0];
          let status = sentEmbed.fields.find((f) => f.name === "Status").value;
          console.log('status: ', status);
          if (status === "Pending") {
            let newFields = sentEmbed.fields.map((f) => {
              if (f.name === "Status") {
                f.value = "Timed Out";
              }
              return f;
            })

            let denialChannel;
            try {
              denialChannel = await interaction.client.channels.fetch(denialChannelId);
              if (denialChannel || denialChannel.type == 0) {
                let reqEmbed = EmbedBuilder.from(sentEmbed);
                reqEmbed.setColor("#8c0cdc");
                reqEmbed.setFields(newFields);
                let autoDeleteMsg = await denialChannel.send({
                  content: `Automatically deleted`,
                  embeds: [reqEmbed],
                });

                if (!autoDeleteMsg.hasThread && threadEnabled) {
                  let denialThread = await denialChannel.threads.create({
                    name: sentEmbed.fields[0]?.value || "Song Request",
                    reason: "Denial of song request",
                    startMessage: autoDeleteMsg
                  })
                  await denialThread.join();
                  await denialThread.send({
                    content: `Song request by <@${sentEmbed.footer.text}> has been deleted automatically.\n\n**Song Name:** ${sentEmbed.fields[0]?.value}\n${sentEmbed.description}`,
                  })
                }
              }

            } catch (e) {
              console.log(e);
            }

            await sent.delete();
          }

        } catch (error) {

        }
      }, 5 * 60 * 1000);

    } catch (e) {
      console.error(e);
      return interaction.editReply({
        content: "There was an error while sending the request!",
        ephemeral: true,
      });
    }

  }
}