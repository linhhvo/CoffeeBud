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

```
4. Set up database
```bash
docker compose up
```

5. Start the server
```bash
go run ./server
```

The server is now listening on `http://localhost:8080`

