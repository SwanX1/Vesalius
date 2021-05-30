import { DMChannel, Message, NewsChannel, PermissionString, TextChannel } from 'discord.js';
import { Vesalius } from '../Vesalius';
import { ParsedArgs } from '../util/ParsedArgs';
export interface CommandOptions {
  requiredPermissions?: PermissionString[];
  fetchMessage?: boolean;
  alias: string | string[];
}

export abstract class BaseCommand {
  public requiredPermissions: PermissionString[];
  public fetchMessage: boolean;
  public alias: string[];
  public client: Vesalius;

  constructor(public id: string, options: CommandOptions) {
    this.requiredPermissions = options.requiredPermissions ?? [];
    this.fetchMessage = options.fetchMessage ?? true;
    this.alias = typeof options.alias === 'string' ? [options.alias] : options.alias;
  }

  public shouldExecute(message: Message): boolean {
    return (
      // Not a DM channel
      !(message.channel instanceof DMChannel) &&
      // Has required permissions
      (message.channel as TextChannel | NewsChannel).permissionsFor(this.client.user).has(this.requiredPermissions) 
    )
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