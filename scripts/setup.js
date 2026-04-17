#!/usr/bin/env node
import { existsSync, copyFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envFile = resolve(root, '.env');
const envExample = resolve(root, '.env.example');

function step(msg) {
  console.log(`\n[setup] ${msg}`);
}
function ok(msg) {
  console.log(`        OK — ${msg}`);
}
function fail(msg) {
  console.error(`        FAIL — ${msg}`);
  process.exit(1);
}

step('1/3  Preparing .env');
if (existsSync(envFile)) {
  ok('.env already exists — skipping copy');
} else {
  if (!existsSync(envExample)) fail('.env.example is missing');
  copyFileSync(envExample, envFile);
  ok('Created .env from .env.example');
}

step('2/3  Checking Docker');
const dockerCheck = spawnSync('docker', ['--version'], { stdio: 'ignore' });
if (dockerCheck.status !== 0) {
  fail('Docker not found. Install Docker Desktop or OrbStack and retry.');
}
ok('Docker is available');

step('3/3  Starting MongoDB (docker compose up -d)');
const up = spawnSync('docker', ['compose', 'up', '-d'], { stdio: 'inherit', cwd: root });
if (up.status !== 0) fail('docker compose up -d failed');
ok('MongoDB container is up');

console.log('\nSetup complete. Next: `npm run dev` to start the server.\n');
