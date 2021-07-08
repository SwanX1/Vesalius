import chalk from 'chalk';
import { Collection, Message } from 'discord.js';
import { ParsedArgs } from '../util/ParsedArgs';
import { Command } from './Command';
import { Listener } from './Listener';
import { Vesalius } from './Vesalius';

export class CommandManager {
  public commands: Collection<string, Command>;
  constructor(public client: Vesalius) {
    this.client.emit('debug', '[CommandManager] Constructing command manager');
    this.commands = new Collection();
    this.client.emit('debug', '[CommandManager] Loading message listener');
    this.client.listenerManager.loadListener(
      new MessageListener(this),
    );
    this.client.emit('debug', '[CommandManager] Done constructing');
  }

  public loadCommand(...commands: Command[]): void {
    commands.forEach(command => {
      if (this.commands.has(command.id)) {
        this.client.logger.warn(chalk`Command with id {yellow '${command.id}'} already loaded, skipping...`);
        return;
      }
      this.client.emit('debug', chalk`[CommandManager] Loading command {yellow '${command.id}'}`);
      this.commands.set(command.id, command);
    });
  }
}

export class MessageListener extends Listener {
  constructor(public commandManager: CommandManager) {
    const client = commandManager.client;
    super('commandMessageListener', client, { event: 'message' });
  }

  public async exec(message: Message): Promise<void> {
    const prefix = await this.client.database.getPrefix(message.guild.id);
    const args: ParsedArgs = ParsedArgs.parse(message, prefix);
    if (args.prefix !== prefix) return;
    const command: Command = this.commandManager.commands.find(command => command.alias.includes(args.command));
    if (!command) return;
    if (!command.shouldExecute(message, args)) return;
    if (command.fetchMessage) await message.fetch();
    command.exec(message, args);
  }
}