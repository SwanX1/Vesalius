import { Message, MessageEmbed } from 'discord.js';
import { formatWithOptions } from 'util';
import { Command } from '../../../struct/Command';
import { Vesalius } from '../../../struct/Vesalius';
import { ParsedArgs } from '../../../util/ParsedArgs';
import { stripIndents } from '../../../util/Util';
import { DebugModule } from '../DebugModule';

export class ReloadLocaleCommand extends Command {
  constructor(private parentModule: DebugModule) {
    super('reload-locale', parentModule.client, {
      alias: ['reload-locale', 'reloadlocale', 'locale-reload', 'localereload'],
      fetchMessage: false,
      requiredBotPermissions: [ 'SEND_MESSAGES' ],
      help: {
        name: locale => stripIndents(this.client.locale.getLocalization(locale, 'command.reload-locale.info.name')),
        description: locale => stripIndents(this.client.locale.getLocalization(locale, 'command.reload-locale.info.description')),
        summary: locale => stripIndents(this.client.locale.getLocalization(locale, 'command.reload-locale.info.summary')),
        usage: locale => stripIndents(this.client.locale.getLocalization(locale, 'command.reload-locale.info.usage')),
        hide: true,
      }
    });
  }

  public override shouldExecute(message: Message): boolean {
    return super.shouldExecute(message) && this.parentModule.allowedUsers.includes(message.author.id);
  }

  public async exec(message: Message, args: ParsedArgs): Promise<void> {
    let reply: Promise<Message> | Message = message.channel.send(
      new MessageEmbed()
        .setDescription(this.client.locale.getLocalization('en_us', 'command.reload-locale.processing'))
        .setColor('BLUE')
    );
    const start = Number(process.hrtime().join('.'));
    // @ts-expect-error reflection
    this.client.locale.localizations = new Map();
    await this.client.locale.readAllLocalizations();
    reply = await reply;
    await reply.edit(
      new MessageEmbed()
        .setDescription(this.client.locale.getLocalization('en_us', 'command.reload-locale.done').replace(/\{ms\}/, ((Number(process.hrtime().join('.')) - start) * 1000).toFixed(3)))
        .setColor('GREEN')
    );
  }
}