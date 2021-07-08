const json5 = require('json5');
const path = require('path');
const fs = require('fs/promises');
const { Client } = require('pg');

main();

async function main() {
  const config = json5.parse((await fs.readFile(path.join(__dirname, '../config.json5'))).toString())
  const database = new Client({
    host: config.database.host,
    port: config.database.port,
    database: config.database.database,
    password: config.database.password,
    user: config.database.username,
  });

  try {
    database.connect();
  } catch (err) {
    console.error('Couldn\'t connect to database!');
    console.error(err);
    process.exit(1);
  }

  // files must match regexp: /^\d+\-\w+\.sql$/
  // indexes must be unique and incrementing.
  let scriptNames = await fs.readdir(path.join(__dirname, 'db_updates'));
  scriptNames = scriptNames.filter(file => /^\d+-\w+\.sql$/.test(file));

  let lastRan;
  try {
    lastRan = Number((await fs.readFile(path.join(__dirname, './db_updates/.last'))).toString());
  } catch {
    lastRan = -1;
  }
  let highestRan = lastRan;

  let scripts = [];
  for (const filename of scriptNames) {
    const index = Number(filename.match(/(?<=^)\d+/)[0]);
    if (index <= lastRan) continue;
    scripts[index] = {
      code: (await fs.readFile(path.join(__dirname, 'db_updates', filename))).toString(),
      name: filename.match(/(?<=^\d+\-)\w+(?=\.sql)/)[0],
      index,
    }
    if (highestRan < index) highestRan = index;
  }
  
  fs.writeFile(path.join(__dirname, './db_updates/.last'), highestRan.toString());

  await database.query('BEGIN');
  console.log('Began TRANSACTION');
  for (const script of scripts) {
    if (typeof script === 'undefined') continue;
    try {
      console.log(`-- ${script.index}-${script.name}.sql`);
      await database.query(script.code);
    } catch (err) {
      console.error(`Couldn't execute script ${script.index}-${script.name}.sql, doing ROLLBACK.`);
      console.error(err);
      await database.query('ROLLBACK');
      process.exit(1);
    }
  }
  await database.query('COMMIT');
  console.log('COMMIT');
  await database.end();
}