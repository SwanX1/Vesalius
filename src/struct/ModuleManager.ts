import chalk from 'chalk';
import { Collection } from 'discord.js';
import { Module } from './Module';
import { Vesalius } from './Vesalius';

export class ModuleManager {
  public modules: Collection<string, Module>;
  constructor(public client: Vesalius) {
    this.client.emit('debug', '[ModuleManager] Constructing module manager');
    this.modules = new Collection();
    this.client.emit('debug', '[ModuleManager] Done constructing');
  }

  public loadModule(...modules: Module[]): void {
    modules.filter(m => m instanceof Module).forEach(m => {
      if (this.modules.has(m.id)) {
        this.client.logger.warn(chalk`Module with id {yellow '${m.id}'} already loaded, skipping...`);
        return;
      }
      this.client.emit('debug', chalk`[ModuleManager] Registering module {yellow '${m.id}'}`);
      this.modules.set(m.id, m);
    });

    this.modules.forEach(m => {
      if (m.dependencies.every(dependency => this.modules.has(dependency))) {
        this.client.emit('debug', chalk`[ModuleManager] Loading module {yellow '${m.id}'}`);
        m.load();
      } else {
        this.client.emit('debug', chalk`[ModuleManager] Dependencies of {yellow '${m.id}'} are missing, skipping...`);
      }
    });
  }
}