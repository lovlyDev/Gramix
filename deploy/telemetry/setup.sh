#!/usr/bin/env bash
# Copyright (C) 2026 lovlydev.
# SPDX-License-Identifier: AGPL-3.0-only
#
# This file is part of Gramix.
#
# See LICENSE and LICENSING.md for details.

# Ставит сборщик статистики в /opt/telemetry. Запуск на сервере:  sudo bash setup.sh [--remove-container ИМЯ]
# Ничего не трогает в других проектах; --remove-container останавливает и удаляет указанный контейнер.
set -euo pipefail
target=/opt/telemetry
remove=""
if [[ "${1:-}" == "--remove-container" ]]; then remove="${2:?укажите имя контейнера}"; fi

if [[ -n "$remove" ]]; then
  echo "Останавливаю и удаляю контейнер $remove"
  docker stop "$remove" && docker rm "$remove"
fi

mkdir -p "$target/data/postgres"
cp "$(dirname "$0")/docker-compose.yml" "$(dirname "$0")/cleanup.sql" "$target/"
if [[ ! -f "$target/.env" ]]; then
  umask 077
  printf 'POSTGRES_PASSWORD=%s\nAPP_SECRET=%s\n' "$(openssl rand -hex 24)" "$(openssl rand -hex 32)" > "$target/.env"
fi
cd "$target"
docker compose pull
docker compose up -d
# Ежедневная очистка данных старше 12 месяцев.
cat > /etc/cron.daily/gramix-telemetry-cleanup <<CRON
#!/bin/sh
cd $target && docker compose exec -T db psql -U umami -d umami -f - < $target/cleanup.sql > /dev/null
CRON
chmod 755 /etc/cron.daily/gramix-telemetry-cleanup
docker compose ps
echo "Готово. Откройте https://<ваш-поддомен> после настройки nginx: логин admin, пароль umami — смените сразу."
