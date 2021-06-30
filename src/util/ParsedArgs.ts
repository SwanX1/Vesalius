import { Message } from 'discord.js';

interface RawParsedArgs {
  prefix: string;
  command: string;
  /** Arguments do not include the command */
  args: string[];
  /** Raw arguments do not include the command */
  rawArgs: string;
}

export class ParsedArgs {
  private _command: string;
  private _prefix: string;
  private _args: string[];
  private _rawArgs: string;

  private constructor({ prefix, command, args, rawArgs }: RawParsedArgs) {
    this._prefix = prefix;
    this._command = command;
    this._args = args;
    this._rawArgs = rawArgs;
  }

  /** The first thing after the prefix */
  public get command(): string {
    return this._command;
  }

  public get prefix(): string {
    return this._prefix;
  }

  /** Shorthand for `args[0]` */
  public get subcommand(): string {
    return this.args[0];
  }

  /** Arguments do not include the command */
  public get args(): string[] {
    return this._args;
  }

  /** Raw arguments do not include the command */
  public get rawArgs(): string {
    return this._rawArgs;
  }

  public static parse(message: Message, prefix: string): ParsedArgs {
    const args: string[] = ParsedArgs.getArguments(message.content.slice(prefix.length, message.content.length));

    return new ParsedArgs({
      prefix,
      command: args.shift(),
      args,
      rawArgs: args.join(' '),
    });
  }

  public static getArguments(body: string): string[] {
    const args: string[] = [];
    let s = body.trim();

    while (s.length > 0) {
      let arg: string;
      if (s.startsWith('"') && s.indexOf('"', 1) > 0) {
        arg = s.slice(1, s.indexOf('"', 1));
        s = s.slice(s.indexOf('"', 1) + 1);
      } else if (s.startsWith("'") && s.indexOf("'", 1) > 0) {
        arg = s.slice(1, s.indexOf("'", 1));
        s = s.slice(s.indexOf("'", 1) + 1);
      } else if (s.startsWith("```") && s.indexOf("```", 3) > 0) {
        arg = s.slice(3, s.indexOf("```", 3));
        s = s.slice(s.indexOf("```", 3) + 3);
      } else if (s.startsWith("`") && s.indexOf("`", 1) > 0) {
        arg = s.slice(1, s.indexOf("`", 1));
        s = s.slice(s.indexOf("`", 1) + 1);
      } else {
        arg = s.split(/\s+/g)[0].trim();
        s = s.slice(arg.length);
      }
      args.push(arg.trim());
      s = s.trim();
    }

    return args;
  }
}