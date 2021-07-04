export type JSONParsable = number | string | boolean | undefined | null | { [key: string]: JSONParsable } | JSONParsable[];
export type ObjectType = { [key: string]: any };

export let options: { throwErrors: boolean; } = { throwErrors: true };

export function stripIndents(input: string): string;
export function stripIndents(input: TemplateStringsArray, ...inserted: string[]): string;
export function stripIndents(input: TemplateStringsArray | string, ...inserted: string[]): string {
  let result: string;
  if (typeof input !== 'string') {
    result = '';
    for (let i = 0; i < input.length + inserted.length; i++) {
      result += i % 2 ? inserted[(i - 1) / 2] : input[i / 2];
    }
  } else {
    result = input;
  }
  return result.replace(/^[^\S\n]+/gm, '').replace(/[^\S\n]+$/gm, '').trim();
}

export function copyObject<T>(obj: T): T {
  const newObj: T = {} as T;
  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    if (typeof obj[key] === 'object') {
      newObj[key] = copyObject(obj[key]);
    } else {
      newObj[key] = obj[key];
    }
  }
  return newObj;
}

export function ensureDotKey(obj: ObjectType, key: string, forcePath = false): ObjectType {
  if (!/^[a-z\$\_]+(\.[a-z\$\_]+)*$/i.test(key)) {
    if (options.throwErrors) {
      throw new Error(`Key '${key}' doesn't adhere to regex: "^[a-z\$\_]+(\.[a-z\$\_]+)*$"`);
    } else {
      return null;
    }
  }
  if (key.indexOf('.') !== -1) {
    const first = key.slice(0, key.indexOf('.'));
    const rest = key.slice(key.indexOf('.') + 1, key.length);
    if (!forcePath && typeof obj[first] !== 'undefined' && !isObject(obj[first])) {
      if (options.throwErrors) {
        throw new Error(`Key '${key}' already exists!`);
      } else {
        return null;
      }
    }
    obj[first] = {};
    try {
      ensureDotKey(obj[first], rest, forcePath);
    } catch {
      if (options.throwErrors) {
        throw new Error(`Key '${key}' already exists!`);
      } else {
        return null;
      }
    }
  } else {
    if (!forcePath && typeof obj[key] !== 'undefined' && !isObject(obj[key])) {
      if (options.throwErrors) {
        throw new Error(`Key '${key}' already exists!`);
      } else {
        return null;
      }
    }
    obj[key] = {};
  }
  return obj;
}

export function setDotKey(obj: ObjectType, key: string, value: any, forcePath = false): ObjectType {
  if (!/^[a-z\$\_]+(\.[a-z\$\_]+)*$/i.test(key)) {
    if (options.throwErrors) {
      throw new Error(`Key '${key}' doesn't adhere to regex: "^[a-z\$\_]+(\.[a-z\$\_]+)*$"`);
    } else {
      return null;
    }
  }
  if (forcePath) ensureDotKey(obj, getLastPartOf(key, '.'), forcePath);

  if (key.indexOf('.') !== -1) {
    const first = key.slice(0, key.indexOf('.'));
    const rest = key.slice(key.indexOf('.') + 1, key.length);
    setDotKey(obj[first], rest, value, forcePath);
  } else {
    obj[key] = value;
  }

  return obj;
}

export function getDotKey(obj: ObjectType, key: string): any {
  if (!/^[a-z\$\_]+(\.[a-z\$\_]+)*$/i.test(key)) {
    if (options.throwErrors) {
      throw new Error(`Key '${key}' doesn't adhere to regex: "^[a-z\$\_]+(\.[a-z\$\_]+)*$"`);
    } else {
      return null;
    }
  }

  if (typeof obj === 'undefined') return undefined;
  
  if (key.indexOf('.') !== -1) {
    const first = key.slice(0, key.indexOf('.'));
    const rest = key.slice(key.indexOf('.') + 1, key.length);
    if (!isObject(obj[first])) return undefined;
    return getDotKey(obj[first], rest);
  } else {
    return obj[key];
  }
}

export function isObject(obj: any): obj is { [key: string]: any } {
  return typeof obj === 'object' && obj !== null && !(obj instanceof Array);
}

export function getLastPartOf(str: string, splitter: string): string {
  return str.slice(0, str.indexOf(splitter) === -1 ? str.length : str.lastIndexOf(splitter))
}

export function indentString(str: string, spaces: number, indentWith = ' '): string {
  let result = str;
  for (let i = 0; i < spaces; i++) {
    result = result.replace(/^/gm, indentWith);
  }
  return result;
}