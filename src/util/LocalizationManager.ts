import chalk from 'chalk';
import fs from 'fs';
import * as fsp from 'fs/promises';
import { parse as parseJson5 } from 'json5';
import path from 'path';
import { Vesalius } from '../struct/Vesalius';

export class LocalizationManager {
  private localizations: Map<string, Record<string, string>> = new Map();
  public readonly localizationDir: string;
  
  constructor(public client: Vesalius) {
    this.localizationDir = path.join(__dirname, '../../assets/lang/');
  }

  public async readAllLocalizations(): Promise<void> {
    const localizations = (await fsp.readdir(this.localizationDir))
      .filter(filename => path.extname(filename) === '.json5')
      .map(filename => filename.replace(/\.json5$/, ''));

    localizations.forEach(async localization => this.getLocalization(localization));
  }

  public getLocalization(localization: string, key: string): string;
  public getLocalization(localization: string): Record<string, string>;
  public getLocalization(localization: string, key?: string): string | Record<string, string> {
    if (!this.localizations.has(localization)) {
      this.client.emit('debug', chalk`[LocalizationManager] Reading localization {yellow '${localization}'}`);
      this.localizations.set(localization, parseJson5(fs.readFileSync(path.join(this.localizationDir, localization + '.json5')).toString()));
    }
    return typeof key === 'string' ? this.localizations.get(localization)[key] : this.localizations.get(localization);
  }
}