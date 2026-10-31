/**
 * Creates or upgrades the primary admin user (role = admin).
 * Loads DATABASE_URL (and optional SEED_*) from .env.local when present.
 *
 * Env:
 *   SEED_ADMIN_USERNAME — default "admin"
 *   SEED_ADMIN_PASSWORD — if omitted, a random password is generated and printed once
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

function loadEnvLocal() {
  const p = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(p)) return;
  const text = fs.readFileSync(p, 'utf8');
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadEnvLocal();

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not set. Add it to .env.local (e.g. file:./dev.db).');
    process.exit(1);
  }

  const username = process.env.SEED_ADMIN_USERNAME || 'admin';
  let password = process.env.SEED_ADMIN_PASSWORD;
  let generated = false;
  if (!password) {
    password = crypto.randomBytes(14).toString('base64url');
    generated = true;
  }

  const prisma = new PrismaClient();
  const hash = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findUnique({ where: { username } });

  if (existing) {
    await prisma.user.update({
      where: { username },
      data: {
        password: hash,
        role: 'admin',
        isActive: true,
      },
    });
    console.log(`Updated "${username}" — role set to admin and password ${generated ? 'set to generated value' : 'reset'}.`);
  } else {
    await prisma.user.create({
      data: {
        username,
        password: hash,
        name: 'Administrator',
        role: 'admin',
      },
    });
    console.log(`Created admin user "${username}".`);
  }

  if (generated) {
    console.log('');
    console.log('Generated password (save securely; it will not be shown again):');
    console.log(password);
    console.log('');
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
