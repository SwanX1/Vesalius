import { Message, MessageEmbed } from 'discord.js';
import { Command } from '../../../struct/Command';
import { Vesalius } from '../../../struct/Vesalius';
import { stripIndents } from '../../../util/Util';

export class PingCommand extends Command {
  constructor(client: Vesalius) {
    super('ping', client, {
      alias: 'ping',
      fetchMessage: false,
      requiredBotPermissions: [ 'SEND_MESSAGES' ],
      help: {
        name: locale => stripIndents(this.client.locale.getLocalization('en_us', 'command.ping.info.name')),
        description: locale => stripIndents(this.client.locale.getLocalization('en_us', 'command.ping.info.description')),
        summary: locale => stripIndents(this.client.locale.getLocalization('en_us', 'command.ping.info.summary')),
        usage: locale => stripIndents(this.client.locale.getLocalization('en_us', 'command.ping.info.usage'))
      }
    });
  }

  public async exec(message: Message): Promise<void> {
    await message.channel.send(
      new MessageEmbed()
        .setTitle(this.client.locale.getLocalization('en_us', 'command.ping.title'))
        .setDescription(this.client.locale.getLocalization('en_us', 'command.ping.description').replace('{ping}', this.client.ws.ping + 'ms'))
        .setColor(this.client.ws.ping < 500 ? 'GREEN' : 'RED')
    );
  }
}