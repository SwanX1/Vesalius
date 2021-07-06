import chalk from 'chalk';
import { Collection } from 'discord.js';
import { ConfigSpec } from '../util/ConfigSpec';
import { isObject } from '../util/Util';
import { Command, CommandConfig } from './Command';
import { Listener, ListenerConfig } from './Listener';
import { Vesalius } from './Vesalius';

export interface ModuleOptions {
  dependencies?: string[];
}

export interface ModuleConfig {
  enabled: boolean;
  commands: { [key: string]: CommandConfig };
  listeners: { [key: string]: ListenerConfig };
}

export abstract class Module {
  public dependencies: string[] = [];
  public enabled: boolean = false;
  public commands: Collection<string, Command> = new Collection();
  public listeners: Collection<string, Listener> = new Collection();

  constructor(public id: string, public client: Vesalius, options: ModuleOptions) {
    this.dependencies = options.dependencies ?? [];
    this.client.emit('debug', chalk`[${client.moduleManager.constructor.name}] Constructing {yellow '${this.constructor.name}'}`);
  }

  public addCommand(...commands: Command[]): void {
    commands.forEach(command => {
      this.commands.set(command.id, command);
    });
  }

  public addListener(...listeners: Listener[]): void {
    listeners.forEach(listener => {
      this.listeners.set(listener.id, listener);
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

    const listenerSpec = new ConfigSpec();
    this.listeners.forEach((listener, id) => {
      const specificListenerSpec = new ConfigSpec();
      listener.buildConfigSpec(specificListenerSpec);
      if (specificListenerSpec.configs.size !== 0) {
        listenerSpec.addConfig(id, specificListenerSpec);
      }
    });
    spec.addConfig('listeners', listenerSpec);
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

      for (const configid in config.listeners) {
        if (!Object.prototype.hasOwnProperty.call(config.listeners, configid)) continue;
        const commandConfig = config.listeners[configid];
        if (this.listeners.get(configid)) {
          this.client.emit('debug', chalk`[${this.constructor.name}] Loading {yellow '${configid}'} listener's config...`);
          this.listeners.get(configid).load(commandConfig);
        }
      }
      this.listeners.forEach(listener => this.client.listenerManager.loadListener(listener));
    }
  }
}