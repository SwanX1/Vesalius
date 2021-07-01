export function stripIndents(input: string): string;
export function stripIndents(input: TemplateStringsArray, ...inserted: string[]): string;
export function stripIndents(input: TemplateStringsArray | string, ...inserted: string[]): string {
  let result;
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
    newObj[key] = obj[key];
  }
  return newObj;
}
