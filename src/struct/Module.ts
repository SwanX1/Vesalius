import chalk from 'chalk';
import { Vesalius } from './Vesalius';

export interface ModuleOptions {
  dependencies?: string[];
  config: ModuleConfig;
}

export interface ModuleConfig {
  enabled: boolean;
}

export abstract class Module {
  public dependencies: string[];
  public enabled: boolean;

  constructor(public id: string, public client: Vesalius, options: ModuleOptions) {
    this.enabled = options.config.enabled;
    this.client.emit('debug', chalk`[${client.moduleManager.constructor.name}] Constructing {yellow '${this.constructor.name}'}`);
    this.dependencies = options.dependencies ?? [];
  }
  
  public abstract load(): Promise<void>;
}