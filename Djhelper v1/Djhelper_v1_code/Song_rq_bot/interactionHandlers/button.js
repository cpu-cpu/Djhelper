import { QuickDB } from "quick.db";
const db = new QuickDB();

import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

const approveSong = async (interaction) => {
  if (interaction.customId != "approve") return;

  let approverRoleId = await db.get(`${interaction.guild.id}_approverRole`);
  let approvalChannelId = await db.get(`${interaction.guild.id}_approvalChannel`);
  let threadEnabled = await db.get(`${interaction.guild.id}_threadEnabled`);


  if (!(approverRoleId && interaction.member.roles.cache.has(approverRoleId)) && !interaction.member.permissions.toArray().includes("Administrator")) {
    await interaction.reply({
      content: "You don't have permission to approve songs!",
      ephemeral: true
    })
    return;
  }

  if(interaction.message.isOngoing) {
    interaction.reply({
      content: "This song request is being reviewd!",
      ephemeral: true
    });
    return;
  }
  interaction.message.isOngoing = true;
  



  let approvalChannel;
  try {
    approvalChannel = await interaction.guild.channels.fetch(approvalChannelId);
  } catch (error) {
    console.error(error);
  }

  if (!approvalChannelId || !approvalChannel || approvalChannel.type != 0) {
    await interaction.reply({
      content: "There is no approval channel set up for this server! If you are an admin, please set one up using the `/config approval` command.",
      ephemeral: true
    })
    interaction.message.isOngoing = false;
    return;
  }

  let apprEmb = interaction.message.embeds[0];
  let reqEmbed = EmbedBuilder.from(apprEmb);
  apprEmb.fields[1].value = "Approved";
  reqEmbed.setColor("#198754");

  let approvalAskMsg = await interaction.reply({
    content: "Channel to approve song in:",
    fetchReply: true
  })

  const filter = (m) => m.author.id == interaction.user.id /* && (/^<#\d{18}>$/).test(m.content.trim()) */;
  const collector = approvalAskMsg.channel.createMessageCollector({ filter, max: 1, time: 60_000 });

  collector.on('collect', async (collectedMsg) => {
    let ans = collectedMsg.content;
    reqEmbed.setFields([...(apprEmb.fields), {
      name: "Approved in channel:",
      value: ans,
    }, {
      name: "Approved by:",
      value: `${interaction.user.tag} (${interaction.user} | ${interaction.user.id})`,
    }]);

    await collectedMsg.delete();
    await collector.stop();
    await interaction.message.edit({
      content: "Approved song!",
      embeds: [reqEmbed],
      components: [],
    });

    let approvalMessage;
    try {
      approvalMessage = await approvalChannel.send({
        content: "Approved song!",
        embeds: [reqEmbed],
      })
    } catch (error) {
      console.error(error);
      await interaction.followUp({
        content: "There was an error while sending the approval message! Try setting up approval channel again",
      }).catch((e) => {
        console.error(e);
      });
    }

    if (!approvalMessage.hasThread && threadEnabled) {
      let approvalThread = await approvalChannel.threads.create({
        name: apprEmb.fields[0]?.value || "Song Request",
        reason: "Approval of song request",
        startMessage: approvalMessage
      })
      await approvalThread.join();
      await approvalThread.send({
        content: `Approved song request by <@${apprEmb.footer.text}> in channel: **${ans}**\n\n**Song Name:** ${apprEmb.fields[0]?.value}\n${apprEmb.description}`,
      })
    }

  });

  collector.on('end', async (collected, reason) => {
    interaction.message.isOngoing = false;
    if (reason == "time") {
      await approvalAskMsg.edit("You took too long to respond.");
      interaction.message.isOngoing = false;
      setTimeout(() => {
        approvalAskMsg.delete();
      }, 5000);
    } else {
      await approvalAskMsg.delete();
    }
  });
}




const denySong = async (interaction) => {
  if (interaction.customId != "deny") return;

  let approverRoleId = await db.get(`${interaction.guild.id}_approverRole`);
  let approvalChannelId = await db.get(`${interaction.guild.id}_denialChannel`);
  let threadEnabled = await db.get(`${interaction.guild.id}_threadEnabled`);

  if (!(approverRoleId && interaction.member.roles.cache.has(approverRoleId)) && !interaction.member.permissions.toArray().includes("Administrator")) {
    await interaction.reply({
      content: "You don't have permission to approve songs!",
      ephemeral: true
    })
    return;
  }

  if(interaction.message.isOngoing) {
    interaction.reply({
      content: "This song request is being reviewd!",
      ephemeral: true
    });
    return;
  }
  interaction.message.isOngoing = true;

  let approvalChannel;
  try {
    approvalChannel = await interaction.guild.channels.fetch(approvalChannelId);
  } catch (error) {
    console.error(error);
  }

  if (!approvalChannelId || !approvalChannel || approvalChannel.type != 0) {
    await interaction.reply({
      content: "There is no denial channel set up for this server! If you are an admin, please set one up using the `/config denial` command.",
      ephemeral: true
    })
    interaction.message.isOngoing = false;
    return;
  }

  let denalEmb = interaction.message.embeds[0];
  let reqEmbed = EmbedBuilder.from(denalEmb);
  denalEmb.fields[1].value = "Denied";
  reqEmbed.setColor("#DC3545");

  let row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setLabel("No Reason")
        .setStyle(ButtonStyle.Danger)
        .setCustomId("noreason"),
    );


  let denialAskMsg = await interaction.reply({
    content: "reason:",
    components: [row],
    fetchReply: true
  })

  const filter = (m) => m.author.id == interaction.user.id /* && (/^<#\d{18}>$/).test(m.content.trim()) */;
  const btnFilter = i => {
    i.deferUpdate();
    return i.user.id === interaction.user.id && i.customId == "noreason";
  };

  const collector = denialAskMsg.channel.createMessageCollector({ filter, max: 1, time: 60_000 });

  collector.on('collect', async (collectedMsg) => {
    let ans = collectedMsg.content;
    await collectedMsg.delete();
    await collector.stop();
    reqEmbed.setFields([...(denalEmb.fields), {
      name: "Denied for reason:",
      value: ans,
    },
    {
      name: "Denied by:",
      value: `${interaction.user.tag} (${interaction.user} | ${interaction.user.id})`,
    }]);

    await interaction.message.edit({
      content: "Denied song!",
      embeds: [reqEmbed],
      components: [],
    });

    let denialMessage;
    try {
      denialMessage = await approvalChannel.send({
        content: "Denied song!",
        embeds: [reqEmbed],
      })
    } catch (error) {
      console.error(error);
      await interaction.followUp({
        content: "There was an error while sending the approval message! Try setting up approval channel again",
      }).catch((e) => {
        console.error(e);
      });
    }

    if (!denialMessage.hasThread && threadEnabled) {
      let denialThread = await approvalChannel.threads.create({
        name: denalEmb.fields[0]?.value || "Song Request",
        reason: "Denial of song request",
        startMessage: denialMessage
      })
      await denialThread.join();
      await denialThread.send({
        content: `Denied song request by <@${denalEmb.footer.text}> for reason: **${ans}**\n\n**Song Name:** ${denalEmb.fields[0]?.value}\n${denalEmb.description}`,
      })
    }

  });

  collector.on('end', async (collected, reason) => {
    interaction.message.isOngoing = false;
    if (reason == "time") {
      await denialAskMsg.edit("You took too long to respond.");
      interaction.message.isOngoing = false;
      setTimeout(() => {
        denialAskMsg.delete();
      }, 5000);
    } else {
      await denialAskMsg.delete();
    }

  });


  denialAskMsg.awaitMessageComponent({ btnFilter, time: 60_000 })
    .then(async awaitedInteraction => {
      collector.stop();
      interaction.message.isOngoing = false;
      reqEmbed.setFields([...(denalEmb.fields),
      {
        name: "Denied by:",
        value: `${interaction.user.tag} (${interaction.user} | ${interaction.user.id})`,
      }]);
      
      await interaction.message.edit({
        content: "Denied song!",
        embeds: [reqEmbed],
        components: [],
      });

      let denialMessage;
      try {
        denialMessage = await approvalChannel.send({
          content: "Denied song!",
          embeds: [reqEmbed],
        })
      } catch (error) {
        console.error(error);
        await interaction.followUp({
          content: "There was an error while sending the approval message! Try setting up approval channel again",
        }).catch((e) => {
          console.error(e);
        });
      }

      if (!denialMessage.hasThread && threadEnabled) {
        let denialThread = await approvalChannel.threads.create({
          name: denalEmb.fields[0]?.value || "Song Request",
          reason: "Denial of song request",
          startMessage: denialMessage
        })
        await denialThread.join();
        await denialThread.send({
          content: `Denied song request by <@${denalEmb.footer.text}>\n\n**Song Name:** ${denalEmb.fields[0]?.value}\n${denalEmb.description}`,
        })
      }


      await denialAskMsg.delete();
    })
    .catch(err => {
      console.error(err)
    });

}

export { approveSong, denySong };