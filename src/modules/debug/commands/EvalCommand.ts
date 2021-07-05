import { Message, MessageEmbed } from 'discord.js';
import { formatWithOptions } from 'util';
import { Command } from '../../../struct/Command';
import { ParsedArgs } from '../../../util/ParsedArgs';
import { stripIndents } from '../../../util/Util';
import { DebugModule } from '../DebugModule';

export class EvalCommand extends Command {
  constructor(private parentModule: DebugModule) {
    super('eval', parentModule.client, {
      alias: [ 'eval', 'exec' ],
      fetchMessage: false,
      requiredBotPermissions: [ 'SEND_MESSAGES' ],
      help: {
        name: locale => stripIndents(this.client.locale.getLocalization(locale, 'command.eval.info.name')),
        description: locale => stripIndents(this.client.locale.getLocalization(locale, 'command.eval.info.description')),
        summary: locale => stripIndents(this.client.locale.getLocalization(locale, 'command.eval.info.summary')),
        usage: locale => stripIndents(this.client.locale.getLocalization(locale, 'command.eval.info.usage')),
        hide: true,
      }
    });
  }
  
  public override shouldExecute(message: Message): boolean {
    return super.shouldExecute(message) && this.parentModule.allowedUsers.includes(message.author.id);
  }

  public async exec(message: Message, args: ParsedArgs): Promise<void> {
    const reply = await message.channel.send(
      new MessageEmbed()
        .setTitle(this.client.locale.getLocalization('en_us', 'command.eval.processing'))
        .setColor('BLUE')
    );
    const start = Number(process.hrtime().join('.'));
    try {
      let output = Function(`return ((message) => {${args.rawArgs}})(arguments[0])`)(message);
      if (output instanceof Promise) output = await output;
      output = formatWithOptions({ colors: false }, output);
      const embed = new MessageEmbed()
        .setTitle(this.client.locale.getLocalization('en_us', 'command.eval.success.title').replace(/\{ms\}/, ((Number(process.hrtime().join('.')) - start) * 1000).toFixed(3)))
        .setColor('GREEN');
      
      output = output.replace(/`/g, '\\`');
      
      embed.addField(this.client.locale.getLocalization('en_us', 'command.eval.success.field'), `\`\`\`javascript\n${output.slice(0, 1000)}\`\`\``)
      output = output.slice(1000, output.length);

      while (output.length !== 0) {
        embed.addField('\u200b', `\`\`\`javascript\n${output.slice(0, 1000)}\`\`\``)
        output = output.slice(1000, output.length);
      }
      
      await reply.edit(embed);
    } catch (err) {
      reply.edit(
        new MessageEmbed()
          .setTitle(this.client.locale.getLocalization('en_us', 'command.eval.error.title').replace(/\{ms\}/, ((Number(process.hrtime().join('.')) - start) * 1000).toFixed(3)))
          .addField(this.client.locale.getLocalization('en_us', 'command.eval.error.field'), `\`\`\`javascript\n${err}\`\`\``)
          .setColor('RED')
      );
    }
  }
}