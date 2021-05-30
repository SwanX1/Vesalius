import chalk from 'chalk';
import { Client, ClientOptions } from 'discord.js';
import { CommandManager } from './commands/CommandManager';
import { PingCommand } from './commands/PingCommand';
import { Logger } from './logging/Logger';
import { LocalizationManager } from './util/LocalizationManager';

export interface VesaliusOptions extends ClientOptions {
  prefix: string;
  logger?: Logger;
}

export class Vesalius extends Client {
  // @ts-ignore
  public logger: Logger = console;
  public defaultPrefix: string;
  public commandManager: CommandManager;
  public locale: LocalizationManager;

  constructor(options: VesaliusOptions) {
    super(options);

    this.defaultPrefix = options.prefix;

    //#region 
    if (options.logger) this.setLogger(options.logger);
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

    this.commandManager = new CommandManager(this);
    this.commandManager.loadCommand(
      new PingCommand(),
    );
  }

  setLogger(logger: Logger): this {
    this.logger = logger;
    return this;
  }
}