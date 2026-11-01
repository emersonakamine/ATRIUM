#!/bin/bash
export NODE_ENV=production
export BAILEYS_SERVER_URL=http://localhost:3000
export BAILEYS_SESSION=bp-eventos
export PORT=3002

cd /home/ubuntu/BP-Eventos
pm2 delete bp-eventos 2>/dev/null
pm2 start dist/server.cjs --name bp-eventos
pm2 save
