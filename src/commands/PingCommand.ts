import { Message, MessageEmbed } from 'discord.js';
import { LocalizationManager } from '../util/LocalizationManager';
import { BaseCommand } from './BaseCommand';

export class PingCommand extends BaseCommand {
  constructor() {
    super('ping', {
      alias: 'ping',
      fetchMessage: false,
      requiredPermissions: [ 'SEND_MESSAGES' ]
    });
  }

  public async exec(message: Message): Promise<void> {
    await message.channel.send(
      new MessageEmbed()
        .setTitle(this.client.locale.getLocalization('en_us', 'command.ping.title'))
        .setDescription(this.client.locale.getLocalization('en_us', 'command.ping.description').replace('{{ping}}', this.client.ws.ping + 'ms'))
        .setColor(this.client.ws.ping < 500 ? 'GREEN' : 'RED')
    );
  }
}