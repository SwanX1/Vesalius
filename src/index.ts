import { createWriteStream, existsSync, lstatSync, mkdirSync, readFileSync } from 'fs';
import { coloredLog, getLoggerLevelName, Logger, LoggerLevel } from './logging/Logger';
import * as json5 from 'json5';
import { Vesalius } from './Vesalius';
import chalk from 'chalk';

interface Config {
  defaultPrefix: string;
  logLevel: LoggerLevel;
  discord: {
    public_key: string;
    application_id: string;
    client_secret: string;
    bot_token: string;
  };
}

if (!existsSync('log')) {
  mkdirSync('log');
} else if (!lstatSync('log').isDirectory()) {
  console.error(coloredLog(LoggerLevel.FATAL) + chalk`Path {green 'log'} already exists and is not a directory!`);
  process.exit(1);
}

if (!process.cwd().endsWith('dist')) {
  process.chdir('dist');
}

const config: Config = json5.parse(readFileSync('../config.json5').toString());

const logger = new Logger({
  streams: [
    {
      level: LoggerLevel.DEBUG,
      stream: createWriteStream('../log/debug.txt'),
      prefix: (level: LoggerLevel) => `[${new Date().toISOString()}] [${getLoggerLevelName(level)}] `,
    },
    {
      level: LoggerLevel.INFO,
      stream: createWriteStream('../log/latest.txt'),
      prefix: (level: LoggerLevel) => `[${new Date().toISOString()}] [${getLoggerLevelName(level)}] `,
    },
    {
      level: config.logLevel,
      stream: process.stdout,
      prefix: coloredLog,
    },
  ]
});

const client: Vesalius = new Vesalius({
  prefix: config.defaultPrefix,
  logger,
});

client.login(config.discord.bot_token);

client.on('ready', () => {
  logger.info(`Logged in as ${client.user.tag}`);
  
  if (client.user.id !== config.discord.application_id) {
    logger.warn('Application ID in config doesn\'t match the actual ID of the bot!');
  }
});