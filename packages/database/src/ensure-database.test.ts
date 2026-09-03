import { describe, expect, it } from 'vitest';
import { databaseNameFromUrl, masterDatabaseUrl } from './ensure-database';

describe('ensure-database URL helpers', () => {
  const url =
    'sqlserver://sa:AipDevPassw0rd@mssql:1433;database=aip;trustServerCertificate=true;encrypt=true';

  it('reads the database name', () => {
    expect(databaseNameFromUrl(url)).toBe('aip');
  });

  it('rewrites the URL to master without leaking a different host', () => {
    expect(masterDatabaseUrl(url)).toBe(
      'sqlserver://sa:AipDevPassw0rd@mssql:1433;database=master;trustServerCertificate=true;encrypt=true',
    );
  });

  it('rejects an unsafe database name', () => {
    expect(() =>
      databaseNameFromUrl(
        'sqlserver://localhost:1433;database=aip-admin;trustServerCertificate=true',
      ),
    ).toThrow(/not safe/);
  });

  it('rejects a master target', () => {
    expect(() =>
      masterDatabaseUrl('sqlserver://localhost:1433;database=master;encrypt=true'),
    ).toThrow(/master/);
  });
});
