import chalk from 'chalk';
import { Collection } from 'discord.js';
import { ConfigSpec, createConfig } from '../util/ConfigSpec';
import { Module, ModuleConfig } from './Module';
import { Vesalius } from './Vesalius';

export class ModuleManager {
  public modules: Collection<string, Module>;
  constructor(public client: Vesalius) {
    this.client.emit('debug', '[ModuleManager] Constructing module manager');
    this.modules = new Collection();
    this.client.emit('debug', '[ModuleManager] Done constructing');
  }

  public addModule(...modules: Module[]): void {
    modules.filter(m => m instanceof Module).forEach(m => {
      if (this.modules.has(m.id)) {
        this.client.logger.warn(chalk`[ModuleManager] Module {yellow '${m.id}'} already added, skipping...`);
      } else {
        this.client.emit('debug', chalk`[ModuleManager] Registering module {yellow '${m.id}'}`);
        this.modules.set(m.id, m);
      }
    });

    this.modules.forEach(m => {
      if (m.dependencies.every(dependency => this.modules.has(dependency))) {
        this.client.emit('debug', chalk`[ModuleManager] Adding module {yellow '${m.id}'}`);
      } else {
        this.client.emit('debug', chalk`[ModuleManager] Dependencies of {yellow '${m.id}'} are missing, skipping...`);
      }
    });
  }

  public loadModules(config: { [module_id: string]: ModuleConfig; }): void {
    this.client.emit('debug', '[ModuleManager] Loading modules...');
    this.modules.forEach(m => {
      m.load(config[m.id]);
      if (!m.enabled) {
        this.client.emit('debug', chalk`[ModuleManager] Module {yellow '${m.id}'} is disabled, skipping...`);
      }
    });
  }

  public buildConfigSpec(spec: ConfigSpec): void {
    this.modules.forEach(m => {
      this.client.emit('debug', chalk`[ModuleManager] Building config for module {yellow '${m.id}'}...`);
      const moduleSpec = new ConfigSpec();
      m.buildConfigSpec(moduleSpec);
      spec.addConfig(m.id, moduleSpec);
    });
  }
}