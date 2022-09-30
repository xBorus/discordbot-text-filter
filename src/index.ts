// prod https://discord.com/api/oauth2/authorize?client_id=848461847182442496&permissions=122943450112&scope=bot%20applications.commands

// dev  https://discord.com/api/oauth2/authorize?client_id=873604023629008896&permissions=122943450112&scope=bot%20applications.commands
import { makeDiscordBot } from "./discordBot";
import { garble } from "./garble";
import { DbUser, getOrCreateByDiscordId } from "./db";
import { GagType, RestrictionLevel, User } from "./domain";
import { makePostgresDb } from "./postgresdb";
import { makeCommandHandler } from "./commandhandler";
import { makeRamDb } from "./ramdb";
import { logger } from "./logger";

const makeDb = async () => {
  try {
    return await makePostgresDb();
  } catch (e) {
    logger.error(e);
    logger.warn("Using RAM database !!!");
    return await makeRamDb();
  }
};
const asyncMain = async () => {
  const db = await makeDb();

  const getUserByDiscordId = async (discordId: string): Promise<User> => {
    const inDb = await getOrCreateByDiscordId<DbUser>(db.users, discordId, {
      data: {
        gagType: GagType.None,
        restriction: RestrictionLevel.None,
        hooded: false,
        hoodText: "",
      },
    });
    return { id: inDb.id, discordId: inDb.discordId, ...inDb.data };
  };

  const bot = await makeDiscordBot({
    ...makeCommandHandler({
      getUserByDiscordId,
      updateUser: async (user) => {
        await db.users.update({
          id: user.id,
          discordId: user.discordId,
          data: user,
        });
      },
    }),
    onMessageDetected: async (message) => {
      const user = await getUserByDiscordId(message.author);
      const filteredName = user.hooded
        ? user.hoodText ?? "Some hooded person"
        : undefined;
      if (user.gagType === GagType.None) return { filteredName };
      return {
        filter: garble(message.content, user.gagType),
        filteredName,
      };
    },
    isEnabledOnChannel: () => Promise.resolve(true),
  });

  process.on("SIGINT", async function () {
    logger.info("Caught interrupt signal");
    await bot.stop();
    process.exit();
  });
};

logger.info("loading");
asyncMain()
  .catch((e) => {
    logger.error(e);
    process.exit(1);
  })
  .then(() => logger.info("ready"));
