import { DiscordCommand, DiscordCommandResult } from "./discordBot";
import { GagType, RestrictionLevel, User } from "./domain";
import { logger } from "./logger";

export interface CommandHandler {
  onCommandDetected: (command: DiscordCommand) => Promise<DiscordCommandResult>;
}

export interface CommandHandlerInfrastructure {
  getUserByDiscordId: (discordId: string) => Promise<User>;
  updateUser: (user: User) => Promise<void>;
}
const gagTypeMessage: Record<GagType, string> = {
  [GagType.Ball]: "ball gag",
  [GagType.Moans]: "gag",
  [GagType.None]: "",
  [GagType.Total]: "tight gag",
};
const commandsCanDoWhileRestrained = new Set<string>(["struggle"]);
export const makeCommandHandler = ({
  getUserByDiscordId,
  updateUser,
}: CommandHandlerInfrastructure): CommandHandler => {
  return {
    onCommandDetected: async (command) => {
      const author = await getUserByDiscordId(command.user);
      logger.info({ author, command }, "Executing command");
      if (
        author.restriction !== RestrictionLevel.None &&
        !commandsCanDoWhileRestrained.has(command.type)
      ) {
        return {
          message: "Cannot do that while restrained",
          showToAll: false,
        };
      }
      switch (command.type) {
        case "struggle": {
          if (author.restriction === RestrictionLevel.None) {
            return {
              message: `You are not bound`,
              showToAll: false,
            };
          }
          if (author.restriction === RestrictionLevel.Inescapable) {
            return {
              message: `*<@${command.user}> struggles in vain*`,
              showToAll: true,
            };
          }
          const struggleIsValid =
            author.struggles &&
            author.struggles?.lastRecovery &&
            author.struggles.lastRecovery > new Date().getTime() - 600;

          const struggle = (struggleIsValid ? author.struggles : undefined) ?? {
            done: author.struggles?.done ?? 0,
            energy: 10,
            lastRecovery: new Date().getTime(),
          };
          if (struggle.energy <= 0) {
            return {
              message: "No energy left",
              showToAll: false,
            };
          }
          const p = struggle.done / 5 / author.restriction;
          if (Math.random() < p) {
            await updateUser({
              ...author,
              restriction: RestrictionLevel.None,
              struggles: undefined,
            });
            return {
              message: `*<@${command.user}> just freed themselves*`,
              showToAll: true,
            };
          }
          const newStruggles = {
            ...struggle,
            done: struggle.done + 1,
            energy: struggle.energy - 1,
          };
          await updateUser({
            ...author,
            struggles: newStruggles,
          });
          return {
            message: `*<@${command.user}> struggles*`,
            showToAll: true,
          };
        }
        case "hood": {
          const victim = await getUserByDiscordId(command.target);
          if (
            victim.hooded === command.hooded &&
            victim.hoodText === command.name
          ) {
            if (!victim.hooded) {
              return {
                message: "User is not hooded",
                showToAll: false,
              };
            }
            return {
              message: "User is already hooded",
              showToAll: false,
            };
          }
          await updateUser({
            ...victim,
            hooded: command.hooded,
            hoodText: command.name,
          });
          if (!command.hooded) {
            if (victim.id === author.id) {
              return {
                message: `*<@${command.user}> removes their hood*`,
                showToAll: true,
              };
            }
            return {
              message: `*<@${command.user}> removes <@${command.target}>'s hood*`,
              showToAll: true,
            };
          }
          if (victim.id === author.id) {
            if (victim.hooded !== command.hooded) {
              return {
                message: `*<@${command.user}> puts a hood on themselves*`,
                showToAll: true,
              };
            } else {
              return {
                message: `*<@${command.user}> adjust the name of their hood*`,
                showToAll: true,
              };
            }
          }
          if (victim.hooded !== command.hooded) {
            return {
              message: `*<@${command.user}> uses a hood on <@${command.target}>*`,
              showToAll: true,
            };
          } else {
            return {
              message: `*<@${command.user}> change the name on <@${command.target}>'s hood*`,
              showToAll: true,
            };
          }
        }
        case "gag": {
          const victim = await getUserByDiscordId(command.target);
          if (victim.gagType === command.level) {
            if (victim.gagType === GagType.None) {
              return {
                message: "User is not gagged",
                showToAll: false,
              };
            }
            return {
              message: "User is already gagged",
              showToAll: false,
            };
          }
          await updateUser({ ...victim, gagType: command.level });
          if (command.level === GagType.None) {
            if (victim.id === author.id) {
              return {
                message: `*<@${command.user}> removes their ${
                  gagTypeMessage[victim.gagType]
                }*`,
                showToAll: true,
              };
            }
            return {
              message: `*<@${command.user}> removes <@${command.target}>'s ${
                gagTypeMessage[victim.gagType]
              }*`,
              showToAll: true,
            };
          }
          if (victim.id === author.id) {
            return {
              message: `*<@${command.user}> puts a ${
                gagTypeMessage[command.level]
              } on themselves*`,
              showToAll: true,
            };
          }
          return {
            message: `*<@${command.user}> uses a ${
              gagTypeMessage[command.level]
            } on <@${command.target}>*`,
            showToAll: true,
          };
        }
        case "restraint": {
          const victim = await getUserByDiscordId(command.target);
          await updateUser({ ...victim, restriction: command.level });
          if (command.level === RestrictionLevel.None) {
            return {
              message: `*<@${command.user}> releases <@${command.target}>*`,
              showToAll: true,
            };
          }
          if (victim.id === author.id) {
            return {
              message: `*<@${command.user}> just did self-bondage. Naughty !*`,
              showToAll: true,
            };
          }
          return {
            message: `*<@${command.user}> binds <@${command.target}>*`,
            showToAll: true,
          };
        }
      }
    },
  };
};
