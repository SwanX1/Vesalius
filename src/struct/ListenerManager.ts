import chalk from 'chalk';
import { Collection } from 'discord.js';
import { Listener } from './Listener';
import { Vesalius } from './Vesalius';

export class ListenerManager {
  public listeners: Collection<string, Listener<any>>;
  constructor(public client: Vesalius) {
    this.client.emit('debug', '[ListenerManager] Constructing listener manager');
    this.listeners = new Collection();
    this.client.emit('debug', '[ListenerManager] Done constructing');
  }

  public loadListener(...listeners: Listener<any>[]): void {
    listeners.forEach(listener => {
      if (this.listeners.has(listener.id)) {
        this.client.logger.warn(chalk`Listener with id {yellow '${listener.id}'} already loaded, skipping...`);
        return;
      }
      this.client.emit('debug', chalk`[ListenerManager] Loading listener {yellow '${listener.id}'}`);
      this.listeners.set(listener.id, listener);
      this.client.on(listener.event, (...args) => {
        if (!listener.shouldExecute(...args)) return;
        listener.exec(...args);
      });
    });
  }
}