import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { getTemplates,renderTemplate } from '../src/services/exitEmail.service';

const argv = yargs(hideBin(process.argv))
  .option('name', {
    alias: 'n',
    type: 'string',
    description: 'Template name (formal, friendly, brief, creative)',
    demandOption: true,
  })
  .option('data', {
    alias: 'd',
    type: 'string',
    description: 'JSON string with placeholder replacements',
  })
  .help()
  .parseSync();

const data = argv.data ? JSON.parse(argv.data) : {};

try {
  const output = renderTemplate(argv.name, data);
  console.log(output);
} catch (err) {
  console.error('Error:', (err as Error).message);
  process.exit(1);
}
