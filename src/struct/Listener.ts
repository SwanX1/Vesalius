import chalk from 'chalk';
import { ClientEvents } from 'discord.js';
import { ConfigSpec } from '../util/ConfigSpec';
import { Base, BaseConfig } from './Base';
import { Vesalius } from './Vesalius';

export interface ListenerOptions<Event extends string> {
  event: Event;
}

export interface ListenerConfig extends BaseConfig { }

export abstract class Listener<
  Event extends keyof ClientEvents = keyof ClientEvents,
  Arguments extends any[] = ClientEvents[Event]
> extends Base {
  public event: keyof ClientEvents;
  
  constructor(id: string, client: Vesalius, options: ListenerOptions<Event>) {
    super(id, client);
    this.event = options.event;
    this.client.emit('debug', chalk`[${client.listenerManager.constructor.name}] Constructing {yellow '${this.constructor.name}'}`);
  }

  public shouldExecute(...args: Arguments): boolean { return true; }

  public override buildConfigSpec(spec: ConfigSpec): void { }
  
  public override load(config: ListenerConfig) {
    super.load(config);
  }

  public abstract override exec(...args: Arguments): any;
}