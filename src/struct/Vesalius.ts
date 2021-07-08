import chalk from 'chalk';
import { Client, ClientOptions } from 'discord.js';
import { Logger, LoggerLevel } from 'logerian';
import { CoreModule } from '../modules/core/CoreModule';
import { DebugModule } from '../modules/debug/DebugModule';
import { ConfigSpec, createConfig } from '../util/ConfigSpec';
import { LocalizationManager } from '../util/LocalizationManager';
import { stripIndents } from '../util/Util';
import { CommandManager } from './CommandManager';
import { Database, DatabaseConfig } from './Database';
import { ListenerManager } from './ListenerManager';
import { ModuleConfig } from './Module';
import { ModuleManager } from './ModuleManager';

export interface Config {
  defaultPrefix: string;
  logLevel: LoggerLevel;
  disableHeartbeatLogs: boolean;
  database: DatabaseConfig;
  modules: { [module_id: string]: ModuleConfig; };
  discord: {
    public_key: string;
    application_id: string;
    client_secret: string;
    bot_token: string;
  };
}

export class Vesalius extends Client {
  // @ts-ignore
  public logger: Logger = console;
  public defaultPrefix: string = '?';
  public commandManager: CommandManager;
  public locale: LocalizationManager;
  public moduleManager: ModuleManager;
  public configSpec: ConfigSpec;
  public listenerManager: ListenerManager;
  public database = new Database();

  constructor(options: ClientOptions, logger?: Logger) {
    super(options);

    //#region 
    if (logger) this.setLogger(logger);
    this.on('debug', (message: string) => {
      const m: string[] = [];
      let s = message.trim();

      while (s.length > 0) {
        let part: string;
        if (s.startsWith('[') && s.indexOf(']', 1) > 0) {
          part = chalk`{cyan [${s.slice(1, s.indexOf(']', 1))}]}`;
          s = s.slice(s.indexOf(']', 1) + 1);
        } else {
          part = s.split(/\s+/g)[0].trim();
          s = s.slice(part.length);
        }
        m.push(part.trim());
        s = s.trim();
      }
      this.logger.debug(m.join(' '));
    });
    //#endregion

    this.locale = new LocalizationManager(this);
    this.locale.readAllLocalizations();

    this.listenerManager = new ListenerManager(this);
    this.commandManager = new CommandManager(this);

    this.moduleManager = new ModuleManager(this);
    
    const coreModule = new CoreModule(this);
    const debugModule = new DebugModule(this);
    this.moduleManager.addModule(coreModule, debugModule);

    const discordConfigSpec = new ConfigSpec()
      .addConfig('public_key', createConfig('').addComment('Public key of the discord application'))
      .addConfig('application_id', createConfig('').addComment('Application ID'))
      .addConfig('client_secret', createConfig('').addComment('Client secret'))
      .addConfig('bot_token', createConfig('').addComment('Bot token'));

    const moduleConfigSpec = new ConfigSpec();
    this.moduleManager.buildConfigSpec(moduleConfigSpec);
    
    const databaseConfigSpec = new ConfigSpec();
    this.database.buildConfigSpec(databaseConfigSpec);

    this.configSpec = new ConfigSpec()
      .addConfig('logLevel',
        createConfig(1)
          .addComment(stripIndents`
            A log level of 3 will show level 4 logs, however a log level of 2 will not show 1 or 0.
            Log levels:
            0: DEBUG
            1: INFO
            2: WARN
            3: ERROR
            4: FATAL
          `)
      )
      .addConfig('disableHeartbeatLogs', createConfig(true).addComment('DEBUG LOGS ONLY: Disables heartbeat logs'))
      .addConfig('database', createConfig(databaseConfigSpec).addComment('Database connection settings'))
      .addConfig('discord', createConfig(discordConfigSpec).addComment('Discord API related settings'))
      .addConfig('modules', createConfig(moduleConfigSpec).addComment('Module specific configs'));
  }

  setLogger(logger: Logger): this {
    this.logger = logger;
    return this;
  }

  load(config: Config): void {
    this.defaultPrefix = config.defaultPrefix ?? this.defaultPrefix;
    this.database.load(config.database);
    this.moduleManager.loadModules(config.modules);
  }
}