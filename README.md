# Runtime
This project is being developed using [Bun](https://bun.com/). There is no need to install node.

Before running the project for the first time, install the dependencies using 
```sh
bun install
```


# Setting Auth

Auth is done using clerk. To run your clerk instance, go to their website and create a new project for free.
- Copy credentials for `express` and paste them into `.dev.vars`
- Copy credentials for `react` and paste it into `.env`

# Running locally

## Database
Running this app requires a Postgres and a Redis databases. 

With Podman + Compose installed on your machine


Run only once the following code to ensure db/pg and db/redis directories exist
```sh
mkdir -p db/pg db/redis
```

Add the following environment variables into .dev.var

| Variable | Value |
| ------|----|
| DATABASE_URL | postgresql://postgres:oF8yWaAkjBcEUAy1@localhost:5432/ytweet |
| REDIS_TOKEN | example_token |
| REDIS_URL| http://localhost:8079 |


Start databases locally

```sh
podman compose up
```

## Execute scripts

You can either run natively or using cloudflare emulator.

- Running natively
```sh
bun run dev
````

- Cloudflare emulator
```sh
bun run cf:dev
```

