import { getConfig } from '@aip/config';
import { waitForDatabase } from './wait-for-database';

await waitForDatabase(getConfig().DATABASE_URL);
process.stdout.write('database reachable\n');
