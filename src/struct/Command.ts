import chalk from 'chalk';
import { DMChannel, Message, NewsChannel, PermissionString, TextChannel } from 'discord.js';
import { ParsedArgs } from '../util/ParsedArgs';
import { Vesalius } from './Vesalius';

export interface CommandOptions {
  requiredBotPermissions?: PermissionString[];
  requiredPermissions?: PermissionString[];
  fetchMessage?: boolean;
  alias: string | string[];
}

export abstract class Command {
  public requiredBotPermissions: PermissionString[];
  public requiredPermissions: PermissionString[];
  public fetchMessage: boolean;
  public alias: string[];

  constructor(public id: string, public client: Vesalius, options: CommandOptions) {
    this.client.emit('debug', chalk`[${client.commandManager.constructor.name}] Constructing {yellow '${this.constructor.name}'}`);
    this.requiredBotPermissions = options.requiredBotPermissions ?? [];
    this.requiredPermissions = options.requiredPermissions ?? [];
    this.fetchMessage = options.fetchMessage ?? true;
    this.alias = typeof options.alias === 'string' ? [options.alias] : options.alias;
  }

  public shouldExecute(message: Message): boolean {
    return (
      // Message channel is not a DM channel
      !(message.channel instanceof DMChannel) &&
      // Bot has required permissions
      (message.channel as TextChannel | NewsChannel).permissionsFor(this.client.user).has(this.requiredBotPermissions) &&
      // Message author has required permissions
      (message.channel as TextChannel | NewsChannel).permissionsFor(message.author).has(this.requiredBotPermissions)
    );
  }

  public abstract exec(message: Message, args: ParsedArgs): any;
}