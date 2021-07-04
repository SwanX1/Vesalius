import chalk from 'chalk';
import { Collection } from 'discord.js';
import { ConfigSpec } from '../util/ConfigSpec';
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

  public loadCommand(...commands: Command[]): void {
    commands.forEach(command => {
      this.commands.set(command.id, command);
    });
    this.client.commandManager.loadCommand(...commands);
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
  }

  public static getDefaultConfig(): ModuleConfig {
    return { enabled: true, commands: {} };
  }
}