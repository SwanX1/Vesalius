import chalk from 'chalk';
import { createWriteStream, existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import * as json5 from 'json5';
import { coloredLog, getLoggerLevelName, Logger, LoggerLevel } from 'logerian';
import { ModuleConfig } from './struct/Module';
import { Vesalius } from './struct/Vesalius';

interface Config {
  defaultPrefix: string;
  logLevel: LoggerLevel;
  disableHeartbeatLogs: boolean;
  modules: { [module_id: string]: ModuleConfig; };
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

if (!existsSync('../config.json5')) {
  console.warn(coloredLog(LoggerLevel.WARN) + 'Config file doesn\'t exist');
  console.warn(coloredLog(LoggerLevel.WARN) + 'Creating new config from template');
  if (existsSync('../config.example.json5')) {
    // Strips formatting, that's why we can't use copyFileSync
    writeFileSync('../config.json5', json5.stringify(json5.parse(readFileSync('../config.example.json5').toString()), null, 2));
  } else {
    console.error(coloredLog(LoggerLevel.FATAL) + chalk`Can't create config: {yellow 'config.example.json5'} doesn't exist`);
  }
  process.exit(0);
}

const config: Config = json5.parse(readFileSync('../config.json5').toString());

const logger = new Logger({
  streams: [
    {
      level: LoggerLevel.DEBUG,
      stream: createWriteStream('../log/' + Date.now() + '-debug.txt'),
      prefix: (level: LoggerLevel) => `[${new Date().toISOString()}] [${getLoggerLevelName(level)}] `,
    },
    {
      level: config.logLevel ?? LoggerLevel.DEBUG,
      stream: process.stdout,
      prefix: coloredLog,
      filter: (message, messageStripped) => config.disableHeartbeatLogs && !/^\[\d\d\:\d\d\:\d\d\] \[DEBUG\] \[WS => Shard \d+\] (\[HeartbeatTimer\] Sending a heartbeat.|Heartbeat acknowledged, latency of \d+ms.)$/.test(messageStripped.toString()),
    },
  ]
});

if (!config.modules['core'].enabled) {
  logger.fatal(chalk`Module {yellow 'core'} cannot be disabled!`);
  process.exit(1);
}

const client: Vesalius = new Vesalius({
  prefix: config.defaultPrefix ?? '!',
  logger,
  modules: config.modules,
});

client.login(config.discord.bot_token);

client.on('ready', () => {
  logger.info(`Logged in as ${client.user.tag}`);
  
  if (client.user.id !== config.discord.application_id) {
    logger.warn('Application ID in config doesn\'t match the actual ID of the bot!');
  }
});

for (const signal of ["SIGABRT", "SIGHUP", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "SIGBREAK"]) {
  process.on(signal, () => {
    logger.info('Exiting...');
    client.destroy();
  });
}
