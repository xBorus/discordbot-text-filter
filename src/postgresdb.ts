import { GagType, RestrictionLevel } from "./domain";
import { Client, QueryConfig, QueryResult, QueryResultRow } from "pg";
import { Db, DbServerChannel, DbUser, DiscordDb } from "./db";
import { logger } from "./logger";

interface AClient {
  query<R extends QueryResultRow = any, I extends any[] = any[]>(
    queryTextOrConfig: string | QueryConfig<I>,
    values?: I
  ): Promise<QueryResult<R>>;
}

const makeLoggingClient = (client: AClient): AClient => ({
  query: async (query, values) => {
    const result = await client.query(query, values);

    logger.trace({ query, result }, "Execute SQL query.");
    return result;
  },
});
const makeGenericDb = async <T>(
  name: string,
  sampleT: T,
  client: AClient
): Promise<DiscordDb<T>> => {
  const size = JSON.stringify(sampleT).length;
  await client.query(
    `
CREATE TABLE IF NOT EXISTS ${name} (
  id SERIAL PRIMARY KEY,
  discordId VARCHAR(32) UNIQUE,
  data VARCHAR(${size * 2 + 100})
)
    `
  );
  // check if db is ready
  return {
    get: async (id) => {
      const result = await client.query(
        `SELECT discordId, data from ${name} WHERE id=$1::integer`,
        [id]
      );
      if (!result.rowCount) return null;
      return {
        data: JSON.parse(result.rows[0]["data"]) as T,
        discordId: result.rows[0]["discordId"],
        id: id,
      };
    },
    delete: async (id) => {
      await client.query(`DELETE from ${name} WHERE id=$1::integer`, [id]);
    },
    create: async (item) => {
      const result = await client.query(
        `INSERT INTO ${name}(discordId,data) VALUES($1::text, $2::text) RETURNING id`,
        [item.discordId, JSON.stringify(item.data)]
      );
      return {
        ...item,
        id: result.rows[0]["id"],
      };
    },
    update: async (item) => {
      await client.query(
        `UPDATE ${name} SET discordId=$1::text, data=$2::text WHERE id=$3::integer`,
        [item.discordId, JSON.stringify(item.data), item.id]
      );
    },

    searchByDiscordId: async (discordId) => {
      const result = await client.query(
        `SELECT id, data from ${name} WHERE discordId=$1::text`,
        [discordId]
      );
      if (!result.rowCount) return null;
      return {
        data: JSON.parse(result.rows[0]["data"]) as T,
        id: result.rows[0]["id"],
        discordId: discordId,
      };
    },
  };
};

export const makePostgresDb = async (): Promise<Db> => {
  const client = new Client();
  await client.connect();
  const loggingClient = makeLoggingClient(client);
  return {
    channels: await makeGenericDb<DbServerChannel>(
      "channels",
      {},
      loggingClient
    ),
    users: await makeGenericDb<DbUser>(
      "users",
      {
        gagType: GagType.Moans,
        restriction: RestrictionLevel.Inescapable,
        struggles: {
          done: 999,
          energy: 999,
          lastRecovery: new Date().getTime(),
        },
        hooded: false,
        hoodText:
          "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      },
      loggingClient
    ),
  };
};
