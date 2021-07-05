import chalk from 'chalk';
import { Collection } from 'discord.js';
import { ConfigSpec } from '../util/ConfigSpec';
import { isObject } from '../util/Util';
import { Command, CommandConfig } from './Command';
import { Vesalius } from './Vesalius';

export interface ModuleOptions {
  dependencies?: string[];
}

export interface ModuleConfig {
  enabled: boolean;
  commands: { [key: string]: CommandConfig };
}

export abstract class Module {
  public dependencies: string[] = [];
  public enabled: boolean = false;
  public commands: Collection<string, Command> = new Collection();

  constructor(public id: string, public client: Vesalius, options: ModuleOptions) {
    this.dependencies = options.dependencies ?? [];
    this.client.emit('debug', chalk`[${client.moduleManager.constructor.name}] Constructing {yellow '${this.constructor.name}'}`);
  }

  public addCommand(...commands: Command[]): void {
    commands.forEach(command => {
      this.commands.set(command.id, command);
    });
  }

  public buildConfigSpec(spec: ConfigSpec): void {
    spec.addConfig('enabled', true);
    const commandSpec = new ConfigSpec();
    this.commands.forEach((command, id) => {
      const specificCommandSpec = new ConfigSpec();
      command.buildConfigSpec(specificCommandSpec);
      if (specificCommandSpec.configs.size !== 0) {
        commandSpec.addConfig(id, specificCommandSpec);
      }
    });
    spec.addConfig('commands', commandSpec);
  }
  
  public load(config: ModuleConfig): void {
    this.enabled = config.enabled;
    if (this.enabled) {
      for (const configid in config.commands) {
        if (!Object.prototype.hasOwnProperty.call(config.commands, configid)) continue;
        const commandConfig = config.commands[configid];
        if (this.commands.get(configid)) {
          this.client.emit('debug', chalk`[${this.constructor.name}] Loading {yellow '${configid}'} command's config...`);
          this.commands.get(configid).load(commandConfig);
        }
      }
      this.commands.forEach(command => this.client.commandManager.loadCommand(command));
    }
  }

  public static getDefaultConfig(): ModuleConfig {
    return { enabled: true, commands: {} };
  }
}