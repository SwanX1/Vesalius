import chalk from 'chalk';
import { Vesalius } from './Vesalius';

export interface ModuleOptions {
  dependencies?: string[];
}

export abstract class Module {
  public dependencies: string[];

  constructor(public id: string, public client: Vesalius, options: ModuleOptions = {}) {
    this.client.emit('debug', chalk`[${client.moduleManager.constructor.name}] Constructing {yellow '${this.constructor.name}'}`);
    this.dependencies = options.dependencies ?? [];
  }
  
  public abstract load(): Promise<void>;
}