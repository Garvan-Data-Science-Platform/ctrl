#! /bin/bash
set -e
yarn workspace backend prisma:generate

yarn workspace backend prisma migrate deploy

yarn workspace backend ts-node scripts/runCreateAdmin.ts

yarn workspace backend start