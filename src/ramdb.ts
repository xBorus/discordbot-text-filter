import { Db, DbServerChannel, DbUser, DiscordDb, DiscordDbItem } from "./db";

const makeGenericDb = <T>(): DiscordDb<T> => {
  let id = 0;
  const map: Map<string, DiscordDbItem<T>> = new Map();
  const discordIdMap: Map<string, string> = new Map();

  // check if db is ready
  return {
    get: async (id) => {
      return map.get(id) ?? null;
    },
    delete: async (id) => {
      map.delete(id);
    },
    create: async (item) => {
      id++;
      const result = { ...item, id: String(id) };
      discordIdMap.set(item.discordId, String(id));
      map.set(String(id), result);

      return result;
    },
    update: async (item) => {
      discordIdMap.set(item.discordId, String(id));
      map.set(String(id), item);
    },

    searchByDiscordId: async (discordId) => {
      const id = discordIdMap.get(discordId);
      if (!id) return null;
      return map.get(id) ?? null;
    },
  };
};

export const makeRamDb = async (): Promise<Db> => {
  return {
    channels: makeGenericDb<DbServerChannel>(),
    users: makeGenericDb<DbUser>(),
  };
};
