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
  public client: Vesalius;

  constructor(public id: string, options: CommandOptions) {
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

  /**
   * To be used in CommandManager.
   * @returns true, if set client successfully; false, if client has already been set
   */
  public setClient(client: Vesalius): boolean {
    if (this.client) return false;
    this.client = client;
    return true;
  }

  public abstract exec(message: Message, args: ParsedArgs): any;
}