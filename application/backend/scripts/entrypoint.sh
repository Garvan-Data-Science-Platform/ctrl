#! /bin/bash

yarn prisma migrate deploy

yarn ts-node scripts/runCreateAdmin.ts

yarn start