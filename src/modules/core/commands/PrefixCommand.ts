import { DMChannel, Message, MessageEmbed, NewsChannel, PartialMessage, TextChannel } from 'discord.js';
import { Command } from '../../../struct/Command';
import { Vesalius } from '../../../struct/Vesalius';
import { ParsedArgs } from '../../../util/ParsedArgs';
import { stripIndents } from '../../../util/Util';

export class PrefixCommand extends Command {
  constructor(client: Vesalius) {
    super('prefix', client, {
      alias: 'prefix',
      fetchMessage: false,
      requiredPermissions: [ 'MANAGE_GUILD' ],
      requiredBotPermissions: [ 'SEND_MESSAGES' ],
      help: {
        name: locale => stripIndents(this.client.locale.getLocalization(locale, 'command.prefix.info.name')),
        description: locale => stripIndents(this.client.locale.getLocalization(locale, 'command.prefix.info.description')),
        summary: locale => stripIndents(this.client.locale.getLocalization(locale, 'command.prefix.info.summary')),
        usage: locale => stripIndents(this.client.locale.getLocalization(locale, 'command.prefix.info.usage'))
      }
    });
  }

  public override shouldExecute(message: Message | PartialMessage, args: ParsedArgs): boolean {
    // Message channel is not a DM channel
    if (message.channel instanceof DMChannel) return false;
    // Bot has required permissions
    if (!message.channel.permissionsFor(this.client.user).has(this.requiredBotPermissions)) return false;
    // Message author has required permissions
    if (!message.channel.permissionsFor(message.author).has(this.requiredPermissions)) {
      message.channel.send(
        new MessageEmbed()
          .setDescription(
            this.client.locale.getLocalization('en_us', 'command.prefix.error.insufficient_permissions')
              .replace(/\{prefix\}/, args.prefix)
          )
          .setColor('RED')
      );
      return false;
    } else {
      return true;
    }
  }

  public async exec(message: Message, args: ParsedArgs): Promise<void> {
    const reply = message.channel.send(
      new MessageEmbed()
        .setTitle(this.client.locale.getLocalization('en_us', 'command.prefix.processing'))
        .setColor('BLUE')
    );
    
    if (args.rawArgs) {
      if (args.rawArgs.trimStart().length > 16) {
        (await reply).edit(
          new MessageEmbed()
            .setDescription(
              this.client.locale.getLocalization('en_us', 'command.prefix.error.too_long')
                .replace(/\{prefix\}/, args.rawArgs.trimStart())
            )
            .setColor('GREEN')
        );
        return;
      }
      const oldPrefix = await this.client.database.getPrefix(message.guild.id);
      await this.client.database.setPrefix(message.guild.id, args.rawArgs.trimStart());
      const newPrefix = await this.client.database.getPrefix(message.guild.id);

      (await reply).edit(
        new MessageEmbed()
          .setDescription(
            this.client.locale.getLocalization('en_us', 'command.prefix.set')
              .replace(/\{oldPrefix\}/, oldPrefix)
              .replace(/\{newPrefix\}/, newPrefix)
          )
          .setColor('GREEN')
      );
    } else {
      const prefix = await this.client.database.getPrefix(message.guild.id);
      (await reply).edit(
        new MessageEmbed()
          .setDescription(
            this.client.locale.getLocalization('en_us', 'command.prefix.fetch')
              .replace(/\{prefix\}/, prefix)
          )
          .setColor('BLUE')
      );
    }
  }
}