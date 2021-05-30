import { Collection, Message } from "discord.js";
import { Vesalius } from "../Vesalius";
import { ParsedArgs } from "../util/ParsedArgs";
import { BaseCommand } from "./BaseCommand";
import chalk from "chalk";

export class CommandManager {
  public commands: Collection<string, BaseCommand>;
  constructor(public client: Vesalius) {
    this.client.emit('debug', '[CommandManager] Constructing command manager!');
    this.commands = new Collection();
    this.client.emit('debug', '[CommandManager] Loading message listener');
    this.client.on('message', message => this.onMessage(message));
    this.client.emit('debug', '[CommandManager] Done constructing!');
  }

  public async onMessage(message: Message): Promise<void> {
    const args: ParsedArgs = ParsedArgs.parse(message, this.client.defaultPrefix);
    const command: BaseCommand = this.commands.find(command => command.alias.includes(args.getCommand()));
    if (!command) return;
    if (!command.shouldExecute(message)) return;
    if (command.fetchMessage) await message.fetch();
    command.exec(message, args);
  }

  public loadCommand(...commands: BaseCommand[]): void {
    commands.forEach(command => {
      if (this.commands.has(command.id)) {
        this.client.logger.warn(chalk`Command with id {yellow '${command.id}'} already loaded, skipping...`);
        return;
      }
      this.client.emit('debug', chalk`[CommandManager] Loading command {yellow '${command.id}'}`);
      this.commands.set(command.id, command);
      command.setClient(this.client);
    });
  }
}