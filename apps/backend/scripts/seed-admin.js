#!/usr/bin/env node
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import { config } from '../src/config/index.js';
import { Caregiver } from '../src/models/Caregiver.js';

const SALT_ROUNDS = 10;

function usage() {
  console.log('Usage: node scripts/seed-admin.js --email <email> --password <password>');
  console.log(
    '       node scripts/seed-admin.js --email <email> --password <password> --firstName <name> --lastName <name>',
  );
  process.exit(1);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 2) {
    const key = argv[i]?.replace(/^--/, '');
    const val = argv[i + 1];
    if (!key || !val) usage();
    args[key] = val;
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.email || !args.password) usage();
  if (args.password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  await mongoose.connect(config.mongoUri);

  const existing = await Caregiver.findOne({ email: args.email.toLowerCase().trim() });
  if (existing) {
    if (existing.role === 'admin') {
      console.log(`Admin already exists: ${args.email}`);
    } else {
      await Caregiver.findByIdAndUpdate(existing._id, { role: 'admin' });
      console.log(`Promoted existing caregiver to admin: ${args.email}`);
    }
  } else {
    const passwordHash = await bcrypt.hash(args.password, SALT_ROUNDS);
    await Caregiver.create({
      firstName: args.firstName || 'Admin',
      lastName: args.lastName || 'User',
      email: args.email,
      passwordHash,
      role: 'admin',
    });
    console.log(`Admin created: ${args.email}`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
