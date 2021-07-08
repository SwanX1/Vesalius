import { Collection } from 'discord.js';
import { Pool, QueryConfig, QueryResult, QueryResultRow } from 'pg';
import { ConfigSpec, createConfig } from '../util/ConfigSpec';
import { copyObject } from '../util/Util';
import { Base, BaseConfig, HasConfig } from './Base';

export interface DatabaseConfig extends BaseConfig {
  defaultPrefix: string;
  username: string;
  password: string;
  database: string;
  host: string;
  port: number;
}

interface DBGuild {
  id: string;
  prefix: string;
}

interface DatabaseCache {
  guilds: Collection<string, DBGuild>;
}

export class Database implements HasConfig {
  private pool: Pool;
  private defaultPrefix: string;
  public cache: DatabaseCache = {
    guilds: new Collection(),
  };

  public buildConfigSpec(spec: ConfigSpec): void {
    spec
      .addConfig('defaultPrefix', createConfig('!'))
      .addConfig('username', createConfig('postgres').addComment('It is recommended to change this from the default.'))
      .addConfig('password', createConfig('').addComment('It is recommended to change this from the default.'))
      .addConfig('database', createConfig('postgres').addComment('It is recommended to change this from the default.'))
      .addConfig('host', '127.0.0.1')
      .addConfig('port', 5432);
  }

  public load(config: DatabaseConfig): void {
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      password: config.password,
      user: config.username,
    });
    this.defaultPrefix = config.defaultPrefix;
    this.emitLoaded();
  }

  //#region pre-load queue
  private listenerQueue: (() => void)[] = [];
  private onLoaded(listener: () => void): void {
    this.listenerQueue.push(listener);
  }

  private emitLoaded(): void {
    this.listenerQueue.forEach(async listener => listener());
  }
  //#endregion

  public async query<R extends QueryResultRow = any, I extends any[] = any[]>(queryTextOrConfig: string | QueryConfig<I>, values?: I): Promise<QueryResult<R>> {
    if (this.pool) {
      return await this.pool.query(queryTextOrConfig, values);
    } else {
      return await new Promise(resolve => {
        this.onLoaded(async () => {
          resolve(await this.pool.query(queryTextOrConfig, values));
        });
      });
    }
  }

  public async getPrefix(guildId: string): Promise<string> {
    await this.getGuild(guildId);
    if (!this.cache.guilds.get(guildId).prefix) {
      const prefix = (await this.query<Pick<DBGuild, 'prefix'>>(`
        SELECT prefix FROM guilds
        WHERE id=$1
        LIMIT 1
      `, [guildId])).rows[0]?.prefix;
      this.cache.guilds.get(guildId).prefix = prefix;
    }

    return this.cache.guilds.get(guildId).prefix ?? this.defaultPrefix;
  }

  public async setPrefix(guildId: string, prefix: string): Promise<void> {
    if (prefix.length > 16) throw new RangeError('Prefix cannot be more than 16 characters long!');
    if (!(await this.getGuild(guildId))) {
      await this.setGuild(guildId);
    }

    if (await this.getPrefix(guildId) !== prefix) {
      await this.query(`
        UPDATE guilds
        SET prefix=$1
        WHERE id=$2
        RETURNING NULL
      `, [prefix, guildId]);
      await this.getGuild(guildId, true);
    }

    return;
  }

  public async getGuild(guildId: string, force = false): Promise<DBGuild | undefined> {
    if (force || !this.cache.guilds.get(guildId)) {
      const guild = (await this.query<DBGuild>(`
        SELECT * FROM guilds
        WHERE id=$1
        LIMIT 1
      `, [guildId])).rows[0];
      this.cache.guilds.set(guildId, copyObject(guild));
    }
    return this.cache.guilds.get(guildId);
  }

  public async setGuild(guildId: string): Promise<void> {
    if (!(await this.getGuild(guildId))) {
      await this.query<DBGuild>(`
        INSERT INTO guilds(id)
        VALUES ($1)
      `, [guildId]);
    }
    return;
  }
}