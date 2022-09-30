import {
  ApplicationCommandData,
  ApplicationCommandOptionType,
  ChannelType,
  Client,
  CommandInteraction,
  Webhook,
  WebhookCreateMessageOptions,
} from "discord.js";
import { logger } from "./logger";
import { GagType, RestrictionLevel } from "./domain";

export interface Discord {
  stop: () => Promise<void>;
}

export interface HoodCommand {
  type: "hood";
  user: string;
  target: string;
  hooded: boolean;
  name: string;
}

export interface DiscordCommandGag {
  type: "gag";
  user: string;
  target: string;
  level: GagType;
}
export interface DiscordCommandRestraint {
  type: "restraint";
  user: string;
  target: string;
  level: RestrictionLevel;
}
export interface DiscordCommandStruggle {
  type: "struggle";
  user: string;
}
export type DiscordCommand =
  | DiscordCommandGag
  | DiscordCommandRestraint
  | DiscordCommandStruggle
  | HoodCommand;

export interface DiscordCommandResult {
  showToAll: boolean;
  message: string;
}

export interface DiscordMessage {
  author: string;
  content: string;
}
export interface DiscordMessageResult {
  filter?: string;
  filteredName?: string;
}
export interface DiscordCallbacks {
  onCommandDetected: (command: DiscordCommand) => Promise<DiscordCommandResult>;
  onMessageDetected: (message: DiscordMessage) => Promise<DiscordMessageResult>;
  isEnabledOnChannel: (id: string) => Promise<boolean>;
}

const commands: ApplicationCommandData[] = [
  {
    description: "Gag someone",
    name: "gag",
    options: [
      {
        name: "user",
        description: "User to gag",
        required: true,
        type: ApplicationCommandOptionType.User,
      },
      {
        name: "type",
        description: "Type of gag",
        type: ApplicationCommandOptionType.Integer,
        required: false,
        choices: [
          { name: "Ball", value: GagType.Ball },
          { name: "Mmpphf", value: GagType.Moans },
        ],
      },
    ],
  },
  {
    description: "Hood someone",
    name: "hood",
    options: [
      {
        name: "user",
        description: "User to hood",
        required: true,
        type: ApplicationCommandOptionType.User,
      },
      {
        name: "name",
        description: "Name to write on the hood",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },
  {
    description: "Unhood someone",
    name: "unhood",
    options: [
      {
        name: "user",
        description: "User to unhood",
        required: true,
        type: ApplicationCommandOptionType.User,
      },
    ],
  },
  {
    description: "Ungag someone",
    name: "ungag",
    options: [
      {
        name: "user",
        description: "User to ungag",
        required: true,
        type: ApplicationCommandOptionType.User,
      },
    ],
  },
  {
    name: "restraint",
    description: "Restraint a user",
    options: [
      {
        name: "user",
        description: "User to restraint",
        required: true,
        type: ApplicationCommandOptionType.User,
      },
    ],
  },
  {
    name: "release",
    description: "Release a user",
    options: [
      {
        name: "user",
        description: "User to release",
        required: true,
        type: ApplicationCommandOptionType.User,
      },
    ],
  },
  {
    name: "struggle",
    description: "Try to struggle",
  },
];

const toCommand = (
  interaction: CommandInteraction
): DiscordCommand | undefined => {
  const user = interaction.user.id;
  switch (interaction.commandName) {
    case "hood": {
      const targetUser = interaction.options.get("user", true).user;
      if (!targetUser || targetUser.bot) return;
      const target = targetUser?.id;

      if (!target) return;
      return {
        type: "hood",
        user,
        target,
        hooded: true,
        name: String(interaction.options.get("name", false)?.value ?? ""),
      };
    }
    case "unhood": {
      const targetUser = interaction.options.get("user", true).user;
      if (!targetUser || targetUser.bot) return;
      const target = targetUser?.id;
      if (!target) return;
      return {
        type: "hood",
        user,
        target,
        hooded: false,
        name: "",
      };
    }
    case "gag": {
      const targetUser = interaction.options.get("user", true).user;
      if (!targetUser || targetUser.bot) return;
      const target = targetUser?.id;
      const type = (interaction.options.get("type")?.value ??
        GagType.Ball) as GagType;
      if (!target) return;
      return {
        type: "gag",
        user,
        target,
        level: type,
      };
    }
    case "ungag": {
      const targetUser = interaction.options.get("user", true).user;
      if (!targetUser || targetUser.bot) return;
      const target = targetUser?.id;
      if (!target) return;
      return {
        type: "gag",
        user,
        target,
        level: GagType.None,
      };
    }
    case "restraint": {
      const targetUser = interaction.options.get("user", true).user;
      if (!targetUser || targetUser.bot) return;
      const target = targetUser?.id;
      if (!target) return;
      return {
        type: "restraint",
        user,
        target,
        level: RestrictionLevel.Normal,
      };
    }
    case "release": {
      const targetUser = interaction.options.get("user", true).user;
      if (!targetUser || targetUser.bot) return;
      const target = targetUser?.id;
      if (!target) return;
      return {
        type: "restraint",
        user,
        target,
        level: RestrictionLevel.None,
      };
    }
    case "struggle": {
      return {
        type: "struggle",
        user,
      };
    }
  }

  return;
};
interface WebHookCacheEntry {
  lastUsage: number;
  hook: Webhook;
}
export const makeDiscordBot = async (
  callbacks: DiscordCallbacks
): Promise<Discord> => {
  const webHookCachesPerServer: Map<
    string,
    Map<string, WebHookCacheEntry>
  > = new Map();
  const client = new Client({
    intents: ["Guilds", "GuildMessages", "MessageContent"],
  });

  const deploy = async (guildId: string) => {
    if (!client.application?.owner) await client.application?.fetch();

    // await client.guilds.cache.get(guildId)?.commands.set(commands);
    await client.application?.commands.set(commands);
  };

  const readyPromise = new Promise<void>((resolve) => {
    client.on("ready", async () => {
      resolve();
    });
  });

  client.on("messageCreate", async (message) => {
    logger.trace({ message }, "[Message]");
    const channel = message.channel;
    if (
      message.webhookId ||
      message.author.bot ||
      !message.guildId ||
      channel.type !== ChannelType.GuildText
    ) {
      logger.trace("skipped");
      return;
    }

    if (message.content === "!gagdeploy") {
      return await deploy(message.guildId);
    }

    const result = await callbacks.onMessageDetected({
      author: message.author.id,
      content: message.content,
    });
    if (result.filter === "") {
      await message.delete();
      return;
    }
    if (!result.filter && !result.filteredName) return;
    if (!webHookCachesPerServer.has(message.guildId)) {
      webHookCachesPerServer.set(message.guildId, new Map());
    }
    const webHookCaches = webHookCachesPerServer.get(message.guildId);
    if (!webHookCaches) throw new Error();

    if (!webHookCaches.has(channel.id)) {
      const hookName = `gagbot-hook-for-${channel}`;
      const hooks = await channel.fetchWebhooks();
      for (const hook of Array.from(hooks.values())) {
        if (
          hook.name === hookName ||
          (hook.name.startsWith("gagbot-hook-for-") && !hooks.has(hook.name))
        )
          await hook.delete();
      }
      if (hooks.size >= 9) {
        // delete least used hook
        const l = [...webHookCaches.entries()].sort(
          ([_aKey, aValue], [_bKey, bValue]) =>
            aValue.lastUsage - bValue.lastUsage
        )[0];
        if (l) {
          const [key, value] = l;
          hooks.delete(key);
          await value.hook.delete();
        }
      }

      webHookCaches.set(channel.id, {
        hook: await channel.createWebhook({ name: hookName }),
        lastUsage: new Date().getTime(),
      });
    }
    const hook = webHookCaches.get(channel.id);
    if (!hook) throw new Error();
    webHookCaches.set(channel.id, { ...hook, lastUsage: new Date().getTime() });
    const member = await message.guild?.members.fetch({ user: message.author });
    const memberName =
      result.filteredName ?? member?.displayName ?? message.author.username;
    const options: WebhookCreateMessageOptions = {
      username: memberName,
      avatarURL:
        (!result.filteredName ? message.author.avatarURL() : undefined) ??
        undefined,
      content: result.filter ?? message.content,
    };
    await message.delete();
    await hook.hook.send(options);
  });

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;
    const command = toCommand(interaction);

    if (!command) {
      await interaction.reply({
        content: "You cannot do that",
        ephemeral: true,
      });
      return;
    }

    logger.info({ command }, "[Command]");
    const result = await callbacks.onCommandDetected(command);
    await interaction.reply({
      content: result.message,
      ephemeral: !result.showToAll,
    });

    return;
  });

  await client.login(process.env["BOT_TOKEN"]);
  await readyPromise;
  return {
    stop: async () => {
      for (const webHooks of [...webHookCachesPerServer.values()])
        for (const hook of Array.from(webHooks.values())) {
          await hook.hook.delete();
        }
      client.destroy();
    },
  };
};
