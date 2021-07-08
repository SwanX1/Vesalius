import { EmbedFieldData, Message, MessageEmbed } from 'discord.js';
import { Command } from '../../../struct/Command';
import { Vesalius } from '../../../struct/Vesalius';
import { MenuPageResolvable, MessageMenu } from '../../../util/MessageMenu';
import { ParsedArgs } from '../../../util/ParsedArgs';
import { copyObject, stripIndents } from '../../../util/Util';

export interface HelpInfo {
  name: string | ((locale: string) => string);
  summary: string | ((locale: string) => string);
  description: string | ((locale: string) => string);
  usage: string | ((locale: string) => string);
  hide?: boolean;
}

export class HelpCommand extends Command {
  constructor(client: Vesalius) {
    super('help', client, {
      alias: ['help', 'h'],
      fetchMessage: false,
      requiredBotPermissions: [ 'SEND_MESSAGES', 'ADD_REACTIONS' ],
      help: {
        name: locale => stripIndents(this.client.locale.getLocalization(locale, 'command.help.info.name')),
        description: locale => stripIndents(this.client.locale.getLocalization(locale, 'command.help.info.description')),
        summary: locale => stripIndents(this.client.locale.getLocalization(locale, 'command.help.info.summary')),
        usage: locale => stripIndents(this.client.locale.getLocalization(locale, 'command.help.info.usage'))
      }
    });
  }

  public async exec(message: Message, args: ParsedArgs): Promise<void> {
    if (args.rawArgs) {
      let command = this.client.commandManager.commands.find(
        command =>
          command.alias.includes(args.rawArgs.toLowerCase()) ||
          command.alias.includes(args.subcommand.toLowerCase()) ||
          command.help.name === args.rawArgs.toLowerCase()
      );
      if (command?.help?.hide) command = undefined;
      if (command) {
        const help = copyObject(command.help);
        for (const prop of ['description', 'name', 'summary', 'usage'] as (Exclude<keyof HelpInfo, 'hide'>)[]) {
          const value = help[prop];
          help[prop] = typeof value === 'function' ? value('en_us') : value;
        }

        message.channel.send(
          new MessageEmbed()
            .setTitle(`${this.client.locale.getLocalization('en_us', 'command.help.fields.command')}: ${help.name}`)
            .addFields(
              {
                name: this.client.locale.getLocalization('en_us', 'command.help.fields.description'),
                value: help.description
              },
              {
                name: this.client.locale.getLocalization('en_us', 'command.help.fields.usage'),
                value: (help.usage as string).replace(/\{prefix\}/g, args.prefix)
              },
              {
                name: this.client.locale.getLocalization('en_us', 'command.help.fields.aliases'),
                value: `\`${command.alias.join('` `')}\``
              }
            )
            .setColor('BLUE')
        );
      } else {
        message.channel.send(
          new MessageEmbed()
            .setDescription(this.client.locale.getLocalization('en_us', 'command.help.error.invalid_command.description'))
            .setColor('RED')
        );
      }
    } else {
      const commands = this.client.commandManager.commands.filter(command => !command.help.hide);
      const pages: MenuPageResolvable[] = [
        new MessageEmbed()
          .setTitle(this.client.locale.getLocalization('en_us', 'command.help.default.quick_usage.title'))
          .setDescription(stripIndents(this.client.locale.getLocalization('en_us', 'command.help.default.quick_usage.description').replace(/\{prefix\}/g, args.prefix)))
          .setFooter(
            this.client.locale.getLocalization('en_us', 'command.help.default.footer')
              .replace(/\{counter\}/g, '1')
              .replace(/\{size\}/g, (Math.ceil(commands.size / 4) + 1).toString())
          )
          .setColor('BLUE')
      ];
      let counter = 1;
      const commandFields: EmbedFieldData[] = [];
      commands.each((command: Command) => {
        commandFields.push({
          name: typeof command.help.name === 'function' ? command.help.name('en_us') : command.help.name,
          value: typeof command.help.summary === 'function' ? command.help.summary('en_us') : command.help.summary
        });
      });
      
      for (let i = 0; i < commandFields.length; i += 4) {
        counter++;
        const fields: EmbedFieldData[] = [];
        for (let j = 0; j < 4; j++) {
          if (commandFields[i + j]) {
            fields.push(commandFields[i + j]);
          }
        }
        pages.push(
          new MessageEmbed()
            .setColor('BLUE')
            .setTitle(this.client.locale.getLocalization('en_us', 'command.help.default.title'))
            .addFields(...fields)
            .setFooter(
              this.client.locale.getLocalization('en_us', 'command.help.default.footer')
                .replace(/\{counter\}/g, counter.toString())
                .replace(/\{size\}/g, (Math.ceil(commands.size / 4) + 1).toString())
            )
        );
      }

      const menu = new MessageMenu(message, {
        pages,
        timeout: 60000,
        reactions: [
          {
            action: 'previousPage',
            reaction: '⬅',
            filter: (reaction, user) => user.id === message.author.id && reaction.emoji.name === '⬅',
          },
          {
            action: 'nextPage',
            reaction: '➡',
            filter: (reaction, user) => user.id === message.author.id && reaction.emoji.name === '➡',
          }
        ]
      });

      menu.exec();
    }
  }
}