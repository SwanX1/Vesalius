import chalk from 'chalk';
import { createWriteStream, existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import * as json5 from 'json5';
import { coloredLog, getLoggerLevelName, Logger, LoggerLevel } from 'logerian';
import { Config, Vesalius } from './struct/Vesalius';

if (!existsSync('log')) {
  mkdirSync('log');
} else if (!lstatSync('log').isDirectory()) {
  console.error(coloredLog(LoggerLevel.FATAL) + chalk`Path {green 'log'} already exists and is not a directory!`);
  process.exit(1);
}

if (!process.cwd().endsWith('dist')) {
  process.chdir('dist');
}

if (process.argv.slice(2).includes('--generate-config') || !existsSync('../config.json5')) {
  const logger = new Logger({
    streams: [
      {
        level: LoggerLevel.INFO,
        stream: process.stdout,
        prefix: coloredLog,
      },
    ]
  });
  logger.info('Generating config...');


  const client: Vesalius = new Vesalius({}, logger);

  logger.info('Config generated, writing to file!');

  writeFileSync('../config.json5', client.configSpec.getJson5());

  logger.info(chalk`{bold Please go and fill out the {green 'config.json5'} file.}`);
  process.exit(0);
}

let configString = readFileSync('../config.json5').toString();
const config: Config = json5.parse(configString);

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

const client: Vesalius = new Vesalius({}, logger);

if (configString !== client.configSpec.getJson5(config)) {
  configString = client.configSpec.getJson5(config);
  writeFileSync('../config.json5', configString);
  logger.warn('Your config was updated, please check if everything works.');
  Object.assign(config, json5.parse(configString));
}

client.load(config);

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
