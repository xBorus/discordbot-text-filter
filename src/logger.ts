import * as pino from "pino";
export const logger = pino.default({
  name: "discordbot",
  level: "trace",
});
