import { Module, ModuleConfig } from '../../struct/Module';
import { Vesalius } from '../../struct/Vesalius';
import { PingCommand } from './commands/PingCommand';

export class CoreModule extends Module {
  constructor(client: Vesalius, config: ModuleConfig) {
    super('core', client, { config });
  }

  public async load(): Promise<void> {
    this.client.emit('debug', '[CoreModule] Loading commands...');
    this.client.commandManager.loadCommand(
      new PingCommand(this.client),
    );
  }
}