import { readFile as rf, writeFile as wf, stat as st, access, mkdir, readdir as rd } from 'node:fs/promises';
import { constants } from 'node:fs';

export interface FsPort {
  readFile(p: string, enc?: BufferEncoding): Promise<string>;
  writeFile(p: string, data: string | Uint8Array): Promise<void>;
  stat(p: string): Promise<import('node:fs').Stats>;
  exists(p: string): Promise<boolean>;
  ensureDir(p: string): Promise<void>;
  readdir(p: string): Promise<string[]>;
}

export const nodeFsPort: FsPort = {
  readFile: (p, enc = 'utf8') => rf(p, { encoding: enc }),
  writeFile: (p, data) => wf(p, data),
  stat: (p) => st(p),
  exists: async (p) => {
    try { await access(p, constants.F_OK); return true; } catch { return false; }
  },
  ensureDir: async (p) => { try { await mkdir(p, { recursive: true }); } catch { /* ignore EEXIST */ } },
  readdir: (p) => rd(p),
};
