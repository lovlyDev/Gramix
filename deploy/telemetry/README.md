# Сбор статистики сайта

Сайт gram.lovlydev.ru отправляет события только после согласия посетителя. Приложение Gramix статистику не отправляет, и код отправки в его сборку не попадает.

Сборщик — [Umami](https://umami.is) с PostgreSQL. Вместе им хватает около 500 МБ памяти, лимиты заданы в `docker-compose.yml`. Umami не хранит IP-адреса в открытом виде.

## Установка на сервер

1. Скопируйте каталог на сервер: `scp -r deploy/telemetry user@server:/tmp/telemetry`.
2. На сервере: `sudo bash /tmp/telemetry/setup.sh`. Если нужно освободить память, ключ `--remove-container ИМЯ` остановит и удалит указанный контейнер.
3. Настройте поддомен по `nginx.conf.example` и выпустите сертификат.
4. Войдите в Umami (`admin` / `umami`), смените пароль, добавьте сайт `gram.lovlydev.ru` и скопируйте его Website ID.
5. В репозитории задайте переменные сайта и пересоберите его:

```bash
gh variable set TELEMETRY_URL --body "https://<поддомен>/api/send"
gh variable set TELEMETRY_SITE_ID --body "<Website ID>"
gh workflow run Site
```

Пока переменные не заданы, сайт не показывает баннер согласия и ничего не отправляет.

## Обслуживание

- Данные старше 12 месяцев удаляются ежедневно (`/etc/cron.daily/gramix-telemetry-cleanup`).
- Резервная копия: `docker compose -f /opt/telemetry/docker-compose.yml exec -T db pg_dump -U umami umami > umami.sql`.
- Во время тяжёлых обновлений на сервере сборщик можно временно остановить: `docker compose -f /opt/telemetry/docker-compose.yml stop`.
