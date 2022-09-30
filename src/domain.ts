export enum GagType {
  None = 0,
  Ball = 1,
  Moans = 9,
  Total = 10,
}

export enum RestrictionLevel {
  None = 0,
  Normal = 5,
  Inescapable = 10,
}

export interface UserStruggle {
  done: number;
  energy: number;
  lastRecovery: number;
}
export interface User {
  id: string;
  discordId: string;
  gagType: GagType;
  restriction: RestrictionLevel;
  struggles?: UserStruggle;
  hooded: boolean;
  hoodText: string;
}

export interface ServerChannel {
  id: string;
  discordId: string;
}

export interface GagUserCommand {
  type: "gag";
  author: User;
  victim: User;
  gagType: GagType;
}

export interface RestraintUserCommand {
  type: "restraint";
  author: User;
  victim: User;
  isRestrained: boolean;
}

export type Command = GagUserCommand | RestraintUserCommand;
