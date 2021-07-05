import chalk from 'chalk';
import { Module, ModuleConfig } from '../../struct/Module';
import { Vesalius } from '../../struct/Vesalius';
import { ConfigSpec, createConfig } from '../../util/ConfigSpec';
import { EvalCommand } from './commands/EvalCommand';
import { ReloadLocaleCommand } from './commands/ReloadLocaleCommand';

export interface DebugConfig extends ModuleConfig {
  allowedUsers: string[];
}

export class DebugModule extends Module {
  public allowedUsers: string[];
  constructor(client: Vesalius) {
    super('debug', client, {});
    this.addCommand(
      new EvalCommand(this),
      new ReloadLocaleCommand(this),
    );
  }

  public override load(config: DebugConfig): void {
    super.load(config);
    this.allowedUsers = config.allowedUsers;
  }

  public override buildConfigSpec(spec: ConfigSpec): void {
    super.buildConfigSpec(spec);
    spec.addConfig('allowedUsers', createConfig([]).addComment('This config determines the user\'s ids that are allowed to interact with the module.'));
    spec.addConfig('enabled', false);
  }
}