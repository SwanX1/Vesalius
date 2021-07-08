import chalk from 'chalk';
import { Module, ModuleConfig } from '../../struct/Module';
import { Vesalius } from '../../struct/Vesalius';
import { ConfigSpec, createConfig } from '../../util/ConfigSpec';
import { HelpCommand } from './commands/HelpCommand';
import { InfoCommand } from './commands/InfoCommand';
import { PingCommand } from './commands/PingCommand';
import { PrefixCommand } from './commands/PrefixCommand';

export class CoreModule extends Module {
  constructor(client: Vesalius) {
    super('core', client, {});
    this.client.emit('debug', '[CoreModule] Adding commands...');
    this.addCommand(
      new PingCommand(this.client),
      new HelpCommand(this.client),
      new InfoCommand(this.client),
      new PrefixCommand(this.client),
    );
  }

  public override load(config: ModuleConfig): void {
    if (!config.enabled) this.client.logger.warn(chalk`Module {yellow 'core'} cannot be disabled, please change the {bold 'modules.core.enabled'} value in the config to {yellow true}`);
    config.enabled = true;
    super.load(config);
  }

  public override buildConfigSpec(spec: ConfigSpec): void {
    super.buildConfigSpec(spec);
    spec.addConfig('enabled', createConfig(true).addComment('This module cannot be disabled.'));
  }
}