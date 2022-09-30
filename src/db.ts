import { ServerChannel, User } from "./domain";

export interface DiscordDbItem<T> {
  id: string;
  discordId: string;
  data: T;
}

export type DbUser = Omit<User, "id" | "discordId">;
export type DbServerChannel = Omit<ServerChannel, "id" | "discordId">;

export interface DiscordDb<T> {
  create: (item: Omit<DiscordDbItem<T>, "id">) => Promise<DiscordDbItem<T>>;
  get: (id: string) => Promise<DiscordDbItem<T> | null>;
  delete: (id: string) => Promise<void>;
  update: (item: DiscordDbItem<T>) => Promise<void>;

  searchByDiscordId: (discordId: string) => Promise<DiscordDbItem<T> | null>;
}
export interface UserDb extends DiscordDb<DbUser> {}

export interface ServerChannelDb extends DiscordDb<DbServerChannel> {}

export interface Db {
  readonly users: UserDb;
  readonly channels: ServerChannelDb;
}

export const getOrCreateByDiscordId = async <T>(
  db: DiscordDb<T>,
  discordId: string,
  item: Omit<DiscordDbItem<T>, "id" | "discordId">
): Promise<DiscordDbItem<T>> => {
  const v = await db.searchByDiscordId(discordId);
  if (!v) {
    return await db.create({ ...item, discordId });
  }
  return v;
};
