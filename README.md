# Getting Started

1. Clone the repo

```bash
git clone https://github.com/linhhvo/CoffeeBud.git
```

2. Install Go dependencies

```bash
go mod download
```

3. Configure environment variables

```bash
POSTGRES_DB=coffeebud_db
POSTGRES_USER=<your_username>
POSTGRES_PASSWORD=<your_password>
POSTGRES_URL=postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@database:5432/${POSTGRES_DB}?sslmode=disable
APP_POSTGRES_URL=postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}?sslmode=disable
JWT_SECRET=<your_secret>
COOKIE_NAME=coffeebud_session
```

4. Set up database

```bash
docker compose up -d
```

To verify that the database tables are set up correctly, run
`docker exec -it coffeebud_database psql coffeebud_db -U <your_username>` and
use command `\dt` in `psql` to list all the tables created.

5. Start the server

```bash
go run ./server
```

The server is now listening on `http://localhost:8080`