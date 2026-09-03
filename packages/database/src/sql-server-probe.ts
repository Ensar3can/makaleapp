import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface SqlServerProbeResult {
  ok: true;
  serverName: string;
}

const WINDOWS_SQLCMD_DIR =
  'C:\\Program Files\\Microsoft SQL Server\\Client SDK\\ODBC\\170\\Tools\\Binn';

function sqlcmdPath(): string {
  if (process.env.SQLCMD_PATH) {
    return process.env.SQLCMD_PATH;
  }

  if (process.platform === 'win32' && !process.env.PATH?.includes('SQL Server\\Client SDK')) {
    process.env.PATH = `${process.env.PATH ?? ''};${WINDOWS_SQLCMD_DIR}`;
  }

  return 'sqlcmd';
}

export async function probeSqlServer(instance: string): Promise<SqlServerProbeResult> {
  const { stdout } = await execFileAsync(
    sqlcmdPath(),
    ['-S', instance, '-E', '-h', '-1', '-W', '-Q', 'SET NOCOUNT ON; SELECT @@SERVERNAME;'],
    {
      windowsHide: true,
      timeout: 15_000,
    },
  );

  const serverName = stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  if (!serverName) {
    throw new Error('SQL Server probe returned an empty server name');
  }

  return { ok: true, serverName };
}
