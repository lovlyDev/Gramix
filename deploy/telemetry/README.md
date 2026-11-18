# Site Statistics Collector

English | [Русский](README.ru.md)

The gram.lovlydev.ru site sends events only after the visitor agrees. The Gramix app sends no statistics, and the sending code is not part of its build.

The collector is [Umami](https://umami.is) with PostgreSQL. Together they need about 500 MB of memory; the limits are set in `docker-compose.yml`. Umami does not store IP addresses in clear text.

## Server Setup

1. Copy the folder to the server: `scp -r deploy/telemetry user@server:/tmp/telemetry`.
2. On the server: `sudo bash /tmp/telemetry/setup.sh`. To free memory, `--remove-container NAME` stops and removes the named container.
3. Add the site to nginx and issue a certificate:

```bash
cp /tmp/telemetry/nginx.conf.example /etc/nginx/conf.d/stats.lovlydev.ru.conf
nginx -t && systemctl reload nginx
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d stats.lovlydev.ru --redirect --agree-tos --register-unsafely-without-email -n
```
4. Sign in to Umami (`admin` / `umami`), change the password, add the site `gram.lovlydev.ru`, and copy its Website ID.
5. Set the site variables in the repository and rebuild:

```bash
gh variable set TELEMETRY_URL --body "https://<subdomain>/api/send"
gh variable set TELEMETRY_SITE_ID --body "<Website ID>"
gh workflow run Site
```

Until the variables are set, the site shows no consent banner and sends nothing.

## Maintenance

- Data older than 12 months is deleted daily (`/etc/cron.daily/gramix-telemetry-cleanup`).
- Backup: `docker compose -f /opt/telemetry/docker-compose.yml exec -T db pg_dump -U umami umami > umami.sql`.
- During heavy updates on the server the collector can be stopped temporarily: `docker compose -f /opt/telemetry/docker-compose.yml stop`.
