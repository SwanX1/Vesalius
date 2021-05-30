import { PingCommand } from './commands/PingCommand';
import { Module } from '../../struct/Module';
import { Vesalius } from '../../struct/Vesalius';

export class CoreModule extends Module {
  constructor(client: Vesalius) {
    super('core', client);
  }

  public async load(): Promise<void> {
    this.client.emit('debug', '[CoreModule] Loading commands...');
    this.client.commandManager.loadCommand(
      new PingCommand(this.client),
    );
  }
}