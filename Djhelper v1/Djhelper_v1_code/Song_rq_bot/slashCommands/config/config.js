import { QuickDB } from "quick.db";
const db = new QuickDB();

export const command = {
  name: "config",
  description: "Configure settings",
  permissions: ["Administrator"],
  options: [
    {
      name: "request",
      type: 1,
      description: "Configure request settings",
      options: [
        {
          name: "channel",
          type: 7,
          description: "Set the request channel",
          required: true,
        }
      ]
    },
    {
      name: "submission",
      type: 1,
      description: "Configure submission settings",
      options: [
        {
          name: "channel",
          type: 7,
          description: "Set the submission channel",
          required: true,
        }
      ]
    },
    {
      name: "approval",
      type: 1,
      description: "Configure approval settings",
      options: [
        {
          name: "channel",
          type: 7,
          description: "Set the approval channel",
          required: true,
        }
      ]
    },
    {
      name: "denial",
      type: 1,
      description: "Configure denial settings",
      options: [
        {
          name: "channel",
          type: 7,
          description: "Set the denial channel",
          required: true,
        }
      ]
    },
    {
      name: "approver",
      type: 1,
      description: "Configure approver settings",
      options: [
        {
          name: "role",
          type: 8,
          description: "Set the approver role",
          required: true,
        }
      ]
    },
    {
      name: "pingrole",
      type: 1,
      description: "Configure ping role settings",
      options: [
        {
          name: "enable",
          type: 5,
          description: "Enable ping role",
          required: true,
        },
        {
          name: "role",
          type: 8,
          description: "Set the ping role",
          required: false,
        }
      ]
    },
    {
      name: "refmsg",
      type: 1,
      description: "Configure reference message settings",
      options: [
        {
          name: "enable",
          type: 5,
          description: "Enable reference message",
          required: true,
        }
      ]
    },
    {
      name: "showsubchannel",
      type: 1,
      description: "Configure if you want to show the subssion channel",
      options: [
        {
          name: "enable",
          type: 5,
          description: "Show submission channel",
          required: true,
        }
      ]
    },
    {
      name: "thread",
      type: 1,
      description: "Configure thread settings",
      options: [
        {
          name: "enable",
          type: 5,
          description: "Enable threads",
          required: true,
        }
      ]
    },
    {
      name: "enable",
      type: 1,
      description: "Enable requests"
    },
    {
      name: "disable",
      type: 1,
      description: "Disable requests"
    }
  ],
  async execute(interaction) {
    switch (interaction.options.getSubcommand()) {
      case "request":
        console.log('igi: ', interaction.guild.id);
        let requestChannel = interaction.options.getChannel("channel");

        if (requestChannel.type != 0) {
          interaction.reply({
            content: "Please select a text channel",
            ephemeral: true,
          });
          return;
        }
        await db.set(`${interaction.guild.id}_requestChannel`, requestChannel.id);
        interaction.reply({
          content: `Request channel set to <#${requestChannel.id}>`
        });
        break;
      case "submission":
        let submissionChannel = interaction.options.getChannel("channel");

        if (submissionChannel.type != 0) {
          interaction.reply({
            content: "Please select a text channel",
            ephemeral: true,
          });
          return;
        }
        await db.set(`${interaction.guild.id}_submissionChannel`, submissionChannel.id);
        interaction.reply({
          content: `Submission channel set to <#${submissionChannel.id}>`
        });
        break;
      case "approval":
        let approvalChannel = interaction.options.getChannel("channel");

        if (approvalChannel.type != 0) {
          interaction.reply({
            content: "Please select a text channel",
            ephemeral: true,
          });
          return;
        }
        await db.set(`${interaction.guild.id}_approvalChannel`, approvalChannel.id);
        interaction.reply({
          content: `Approval channel set to <#${approvalChannel.id}>`
        });
        break;

      case "denial":
        let denialChannel = interaction.options.getChannel("channel");

        if (denialChannel.type != 0) {
          interaction.reply({
            content: "Please select a text channel",
            ephemeral: true,
          });
          return;
        }
        await db.set(`${interaction.guild.id}_denialChannel`, denialChannel.id);
        interaction.reply({
          content: `Denial channel set to <#${denialChannel.id}>`
        });
        break;
        
      case "approver":
        let approverRole = interaction.options.getRole("role");
        await db.set(`${interaction.guild.id}_approverRole`, approverRole.id);
        interaction.reply({
          content: `Approver role set to <@&${approverRole.id}>`
        });
        break;
      case "pingrole":
        let pingRoleEnabled = interaction.options.getBoolean("enable");
        let pingRole = interaction.options.getRole("role");
        if (pingRoleEnabled) {
          if (!pingRole) {
            interaction.reply({
              content: "Please select a role",
              ephemeral: true,
            });
            return;
          }
          await db.set(`${interaction.guild.id}_pingRole`, pingRole.id);
          interaction.reply({
            content: `Ping role set to <@&${pingRole.id}>`
          });
        } else {
          let dltd = await db.delete(`${interaction.guild.id}_pingRole`);
          console.log('dltd: ', dltd);
          interaction.reply({
            content: `Ping role disabled`
          });
        }
        break;
      case "refmsg":
        let refMsgEnabled = interaction.options.getBoolean("enable");
        if (refMsgEnabled) {
          await db.set(`${interaction.guild.id}_refmsg`, true);
          interaction.reply({
            content: `Reference message enabled`
          });
        }else{
          await db.delete(`${interaction.guild.id}_refmsg`);
          interaction.reply({
            content: `Reference message disabled`
          });
        }
        break;
      
      case "showsubchannel":
        let showsubchannel = interaction.options.getBoolean("enable");
        if (showsubchannel) {
          await db.set(`${interaction.guild.id}_showsubchannel`, true);
          interaction.reply({
            content: `Submission channel will be shown`
          });
        }else{
          await db.delete(`${interaction.guild.id}_showsubchannel`);
          interaction.reply({
            content: `Submission channel will not be shown`
          });
        }
        break;

      case "thread":
        let threadEnabled = interaction.options.getBoolean("enable");
        if (threadEnabled) {
          await db.set(`${interaction.guild.id}_threadEnabled`, true);
          interaction.reply({
            content: `Threads enabled`
          });
        }else{
          await db.delete(`${interaction.guild.id}_threadEnabled`);
          interaction.reply({
            content: `Threads disabled`
          });
        }
        break;
      case "enable":
        await db.set(`${interaction.guild.id}_enabled`, true);
        interaction.reply({
          content: `Requests enabled`
        });
        break;
      case "disable":
        await db.delete(`${interaction.guild.id}_enabled`);
        interaction.reply({
          content: `Requests disabled`
        });
        break;
    }
  }
}