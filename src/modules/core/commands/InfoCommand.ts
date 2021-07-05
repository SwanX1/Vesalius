import { Message, MessageEmbed } from 'discord.js';
import { Command, CommandConfig } from '../../../struct/Command';
import { Vesalius } from '../../../struct/Vesalius';
import { ConfigSpec } from '../../../util/ConfigSpec';
import { secondsToHHMMSS, stripIndents } from '../../../util/Util';

export interface InfoConfig extends CommandConfig {
  github_name: string;
  github_link: string;
  issue_tracker: string;
}

export class InfoCommand extends Command {
  private config: InfoConfig;

  constructor(client: Vesalius) {
    super('info', client, {
      alias: 'info',
      fetchMessage: false,
      requiredBotPermissions: [ 'SEND_MESSAGES' ],
      help: {
        name: locale => stripIndents(this.client.locale.getLocalization(locale, 'command.info.info.name')),
        description: locale => stripIndents(this.client.locale.getLocalization(locale, 'command.info.info.description')),
        summary: locale => stripIndents(this.client.locale.getLocalization(locale, 'command.info.info.summary')),
        usage: locale => stripIndents(this.client.locale.getLocalization(locale, 'command.info.info.usage'))
      }
    });
  }

  public async exec(message: Message): Promise<void> {
    const inviteLink = `https://discord.com/oauth2/authorize?client_id=${this.client.user.id}&scope=bot&permissions=1879419990`;
    message.channel.send(
      new MessageEmbed()
        .setTitle(this.client.locale.getLocalization('en_us', 'command.info.title'))
        .addFields(
          {
            name: this.client.locale.getLocalization('en_us', 'command.info.fields.host_system'),
            value: `${process.platform} ${process.arch}`,
            inline: true,
          },
          {
            name: this.client.locale.getLocalization('en_us', 'command.info.fields.bot_version'),
            value: process.env.VERSION,
            inline: true,
          },
          {
            name: this.client.locale.getLocalization('en_us', 'command.info.fields.uptime'),
            value: secondsToHHMMSS(process.uptime()),
            inline: true,
          },
          {
            name: this.client.locale.getLocalization('en_us', 'command.info.fields.github'),
            value: `[${this.config.github_name}](${this.config.github_link})`,
            inline: true,
          },
          {
            name: this.client.locale.getLocalization('en_us', 'command.info.fields.invite.title'),
            value: `[${this.client.locale.getLocalization('en_us', 'command.info.fields.invite.content')}](${inviteLink})`,
            inline: true,
          },
          {
            name: this.client.locale.getLocalization('en_us', 'command.info.fields.issue_tracker'),
            value: `[${this.config.issue_tracker}](${this.config.issue_tracker})`,
          },
          {
            name: '\u200B',
            value: this.client.locale.getLocalization('en_us', 'command.info.fields.node_version').replace(/\{version\}/, process.version),
          },
        )
        .setColor('BLUE')
    )
  }

  public override load(config: InfoConfig): void {
    this.config = config;
  }

  public override buildConfigSpec(spec: ConfigSpec): void {
    super.buildConfigSpec(spec);
    spec.addConfig('github_name', 'SwanX1/Vesalius');
    spec.addConfig('github_link', 'https://github.com/SwanX1/Vesalius');
    spec.addConfig('issue_tracker', 'https://github.com/SwanX1/Vesalius/issues');
  }
}