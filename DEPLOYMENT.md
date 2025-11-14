## Production Deployment (EC2 + Docker)

1. **Prerequisites**
   - Ubuntu 22.04 EC2 instance with ports 80/443 open in the security group.
   - Docker Engine + Compose plugin installed.
   - DNS `A` records for `alpr.stalresearch.com` (frontend) and `alprbe.stalresearch.com` (backend) pointing to the EC2 public IP.

2. **Clone & Configure**
   ```bash
   git clone <repo-url> alpr-app && cd alpr-app
   cp .env.example .env
   # Edit .env with real Let’s Encrypt email, custom domains, and Mongo settings if needed
   ```

3. **Build Images**
   ```bash
   docker compose --env-file .env -f docker-compose.prod.yml build
   ```

4. **Obtain TLS Certificates (before starting nginx)**
   ```bash
   docker compose -f docker-compose.prod.yml run --rm --service-ports certbot certonly \
     --standalone \
     -d "$FRONTEND_DOMAIN" -d "$BACKEND_DOMAIN" \
     --email "$LETSENCRYPT_EMAIL" --agree-tos --no-eff-email
   ```
   - The `--service-ports` flag exposes ports 80/443 from the certbot container so Let’s Encrypt can reach it.
   - Repeat the `certonly` command for any additional domains required by the site.

5. **Start the Stack**
   ```bash
    docker compose --env-file .env -f docker-compose.prod.yml up -d
   ```
   - Mongo stores data in the `mongo-data` volume.
   - Backend and frontend stay on the internal Docker network; Nginx is the only service published on 80/443.

6. **Verification**
   - `curl -I https://alpr.stalresearch.com` should return `200`.
   - `curl -I https://alprbe.stalresearch.com` should return `200`.
   - `curl https://alprbe.stalresearch.com/vehicle_counts` should proxy through to FastAPI.
   - Open the site in a browser and check that frontend API calls go to `https://alprbe.stalresearch.com`.

7. **Routine Operations**
   - Update code via `git pull` followed by `docker compose -f docker-compose.prod.yml up -d --build`.
   - Inspect logs with `docker compose -f docker-compose.prod.yml logs -f nginx|backend|frontend`.
   - Backup Mongo by snapshotting the `mongo-data` volume or dumping with `mongodump` inside the Mongo container.
   - Renew certificates (e.g., via cron) using:
     ```bash
     docker compose -f docker-compose.prod.yml run --rm --service-ports certbot renew
     docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
     ```
