import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { atomicWriteFile } from '../../src/main/persistence/atomicWrite';

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(join(tmpdir(), 'slidify-atomic-'));
});

afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

describe('atomicWriteFile', () => {
  it('writes the file when the target directory exists', async () => {
    const target = join(tmp, 'a.txt');
    await atomicWriteFile(target, 'hello');
    expect(await fs.readFile(target, 'utf8')).toBe('hello');
  });

  it('creates missing parent directories', async () => {
    const target = join(tmp, 'nested', 'deep', 'a.txt');
    await atomicWriteFile(target, 'hi');
    expect(await fs.readFile(target, 'utf8')).toBe('hi');
  });

  it('overwrites existing files atomically', async () => {
    const target = join(tmp, 'a.txt');
    await fs.writeFile(target, 'old');
    await atomicWriteFile(target, 'new');
    expect(await fs.readFile(target, 'utf8')).toBe('new');
  });

  it('leaves no .tmp sibling on success', async () => {
    const target = join(tmp, 'a.txt');
    await atomicWriteFile(target, 'hello');
    const entries = await fs.readdir(tmp);
    expect(entries).toEqual(['a.txt']);
  });

  it('writes binary payloads byte-for-byte', async () => {
    const target = join(tmp, 'bin.dat');
    const payload = new Uint8Array([0, 1, 2, 255, 128, 64]);
    await atomicWriteFile(target, payload);
    const read = await fs.readFile(target);
    expect(read.equals(Buffer.from(payload))).toBe(true);
  });
});
