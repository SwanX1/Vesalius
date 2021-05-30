import chalk from 'chalk';
import fs from 'fs';

export type PrefixPredicate = (level: LoggerLevel) => string;

export interface LoggerOutput {
  stream: NodeJS.WritableStream;
  level: LoggerLevel;
  prefix?: PrefixPredicate;
}

export interface LoggerOptions {
  streams: LoggerOutput[];
}

export enum LoggerLevel {
  DEBUG = 0,
  INFO  = 1,
  WARN  = 2,
  ERROR = 3,
  FATAL = 4,
}

export function getLoggerLevelName(level: LoggerLevel): 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL' {
  if (level == LoggerLevel.DEBUG || level < 0) return 'DEBUG';
  if (level == LoggerLevel.INFO) return 'INFO';
  if (level == LoggerLevel.WARN) return 'WARN';
  if (level == LoggerLevel.ERROR) return 'ERROR';
  if (level == LoggerLevel.FATAL || level > 4) return 'FATAL';
}

export function coloredLog(level: LoggerLevel): string {
  const date: Date = new Date();
  const time: string = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
  let loglevelcolor: string;
  switch (level) {
    case LoggerLevel.DEBUG:
      loglevelcolor = 'blue';
      break;
    case LoggerLevel.INFO:
      loglevelcolor = 'green';
      break;
    case LoggerLevel.WARN:
      loglevelcolor = 'yellow';
      break;
    case LoggerLevel.ERROR:
      loglevelcolor = 'red';
      break;
    case LoggerLevel.FATAL:
      loglevelcolor = 'red';
      break;
  }
  let loggerLevelPrefix: string = getLoggerLevelName(level);
  loggerLevelPrefix = `[${loggerLevelPrefix}]`.padEnd(7, ' ');
  return chalk`{gray [${time}]} {${loglevelcolor} ${loggerLevelPrefix}} `;
}

export class Logger {
  static defaultOptions: LoggerOptions = {
    streams: [
      {
        stream: process.stdout,
        level: LoggerLevel.INFO,
        prefix: (level: LoggerLevel) => `[${new Date().toLocaleTimeString()}] `
      }
    ],
  };

  private options: LoggerOptions;
  private outputs: LoggerOutput[];

  constructor(options?: LoggerOptions) {
    this.options = options ?? Logger.defaultOptions;
    this.outputs = [];
    for (const output of this.options.streams) {
      this.addOutput(output);
    }
  }

  public addOutput(output: LoggerOutput): this {
    this.outputs.push(output);
    return this;
  }

  public log(data: string | Uint8Array): void {
    return this.internalLog(LoggerLevel.INFO, data);
  }
  
  public debug(data: string | Uint8Array): void {
    return this.internalLog(LoggerLevel.DEBUG, data);
  }
  
  public info(data: string | Uint8Array): void {
    return this.internalLog(LoggerLevel.INFO, data);
  }
  
  public warn(data: string | Uint8Array): void {
    return this.internalLog(LoggerLevel.WARN, data);
  }
  
  public error(data: string | Uint8Array): void {
    return this.internalLog(LoggerLevel.ERROR, data);
  }
  
  public fatal(data: string | Uint8Array): void {
    return this.internalLog(LoggerLevel.FATAL, data);
  }

  private internalLog(level: LoggerLevel, data: string | Uint8Array): void {
    for (const output of this.outputs) {
      if (output.level <= level) {
        let s = '';
        if (typeof output.prefix === 'function') {
          s += output.prefix(level);
        }
        s += data;
        s += '\n';
        if (output.stream instanceof fs.WriteStream) {
          // Remove ansi codes
          output.stream.write(
            s.replace(
              /[\u001B\u009B][[\]()#;?]*(?:(?:(?:[a-zA-Z\d]*(?:;[-a-zA-Z\d\/#&.:=?%@~_]*)*)?\u0007)|(?:(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PR-TZcf-ntqry=><~]))/g,
              ''
            )
          );
        } else {
          output.stream.write(s);
        }
      }
    }
  }
}