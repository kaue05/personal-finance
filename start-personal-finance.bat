@echo off
cd /d "D:\PROJETOS DEV\personal-finance"
pm2 start .next/standalone/server.js --name personal-finance
exit