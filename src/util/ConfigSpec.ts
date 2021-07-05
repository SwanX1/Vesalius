import { getDotKey, getLastPartOf, indentString, isObject, ObjectType, options as utilOptions, setDotKey } from './Util';
import * as json5 from 'json5';

export class ConfigSpec {
  public configs: Map<string, Config<any>> = new Map();

  public addConfig(key: string, defaultValue: any | Config<any>): this {
    if (!/^[a-z\$\_]+(\.[a-z\$\_]+)*$/i.test(key)) throw new Error(`Key '${key}' doesn't adhere to regex: "^[a-z\$\_]+(\.[a-z\$\_]+)*$"`);
    this.configs.set(key, defaultValue instanceof Config ? defaultValue : createConfig(defaultValue));
    return this;
  }

  public static createConfigSpec(obj: ObjectType): ConfigSpec {
    const configSpec = new ConfigSpec();
    for (const key in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
      const value = obj[key];
      if (isObject(value)) {
        configSpec.addConfig(key, ConfigSpec.createConfigSpec(value));
      } else {
        configSpec.addConfig(key, value);
      }
    }
    return configSpec;
  }

  public getJson5(existing?: ObjectType | ConfigSpec): string {
    if (typeof existing === 'undefined') {
      return this.getJson5({});
    } else if (!(existing instanceof ConfigSpec)) {
      return this.getJson5(ConfigSpec.createConfigSpec(existing));
    } else {
      let revertThrowErrors = false;
      if (utilOptions.throwErrors) {
        revertThrowErrors = true;
        utilOptions.throwErrors = false;
      }
      const obj: { [key: string]: Config<any> } = {};
      const existingObj: { [key: string]: Config<any> } = {};
      
      for (const [key, value] of this.configs) {
        obj[key] = value;
      }

      for (const [key, value] of existing.configs) {
        existingObj[key] = value;
      }

      console.log({ obj, existingObj });
      
      let result = '{';

      for (const key in obj) {
        if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
        const value = obj[key];
        const existingValue = existingObj[key];
        if (existingValue) {
          if (existingValue.isConfigSpec()) {
            result += '\n' + indentString(value.toStringSpec(getLastPartOf(key, '.'), existingValue.getValue()), 2);
          } else {
            value.setValue(existingValue.getValue());
            result += '\n' + indentString(value.toString(getLastPartOf(key, '.'), 2), 2);
          }
        } else {
          result += '\n' + indentString(value.toString(getLastPartOf(key, '.'), 2), 2);
        }
      }

      if (result !== '{') {
        result += '\n';
      }
      result += '}';

      if (revertThrowErrors) {
        utilOptions.throwErrors = true;
      }
      return result;
    }
  }
}

export function createConfig<T>(value: T): Config<T> {
  return new Config(value);
}

export class Config<T> {
  private value: T = null;
  private comments: string[] = [];

  public constructor(value?: T) {
    this.value = value;
  }

  public getValue(): T {
    return this.value;
  }

  public setValue(value: T): this {
    this.value = value;
    return this;
  }

  public addComment(comment: string): this {
    this.comments.push(...comment.split(/\r?\n/));
    return this;
  }

  public getComments(): string[] {
    return this.comments;
  }

  public hasJson5Function(): this is Config<{ getJson5: Function }> {
    return typeof this.value['getJson5'] === 'function';
  }

  public toString(key: string, spaces?: number): string {
    let result = '';
    for (const comment of this.comments) {
      result += `\n// ${comment}`;
    }
    key = /^[a-z\$_][a-z0-9\$_]*$/i.test(key) ? key : json5.stringify(key);
    if (this.hasJson5Function()) {
      result += `\n${key}: ${this.value.getJson5()},`;
    } else {
      result += `\n${key}: ${json5.stringify(this.value, null, spaces)},`;
    }
    return result.trim();
  }



  public isConfigSpec(): this is Config<ConfigSpec> {
    return this.value instanceof ConfigSpec;
  }

  public toStringSpec(key: string, existing: ConfigSpec): string {
    if (!this.isConfigSpec()) throw new TypeError('Value is not a config spec!');
    let result = '';
    for (const comment of this.comments) {
      result += `\n// ${comment}`;
    }
    key = /^[a-z\$_][a-z0-9\$_]*$/i.test(key) ? key : json5.stringify(key);
    result += `\n${key}: ${this.value.getJson5(existing)},`;
    return result.trim();
  }
}