#!/bin/bash
echo "=== User Info ===" > diagnosis.log
whoami >> diagnosis.log
id >> diagnosis.log

echo -e "\n=== Current Directory ===" >> diagnosis.log
pwd >> diagnosis.log

echo -e "\n=== Network Ports (5432) ===" >> diagnosis.log
netstat -plnt | grep 5432 >> diagnosis.log 2>&1

echo -e "\n=== Postgres Processes ===" >> diagnosis.log
ps aux | grep postgres >> diagnosis.log 2>&1

echo -e "\n=== Postgres Databases (via socket) ===" >> diagnosis.log
psql -U postgres -c '\l' >> diagnosis.log 2>&1

echo -e "\n=== Postgres Databases (via TCP 127.0.0.1) ===" >> diagnosis.log
psql "postgresql://postgres:postgres@127.0.0.1:5432/postgres" -c '\l' >> diagnosis.log 2>&1

echo -e "\n=== Prisma Status ===" >> diagnosis.log
npx prisma migrate status >> diagnosis.log 2>&1
