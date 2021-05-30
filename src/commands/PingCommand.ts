import { Message, MessageEmbed } from 'discord.js';
import { Command } from '../struct/Command';

export class PingCommand extends Command {
  constructor() {
    super('ping', {
      alias: 'ping',
      fetchMessage: false,
      requiredBotPermissions: [ 'SEND_MESSAGES' ]
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