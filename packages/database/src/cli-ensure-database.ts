import { getConfig } from '@aip/config';
import { ensureDatabaseExists, masterDatabaseUrl } from './ensure-database';
import { waitForDatabase } from './wait-for-database';

const databaseUrl = getConfig().DATABASE_URL;
await waitForDatabase(masterDatabaseUrl(databaseUrl));
const name = await ensureDatabaseExists(databaseUrl);
process.stdout.write(`database ready: ${name}\n`);
