# Gig Service (5-gig-service)

The Gig Service manages gig listings and related domain logic (create/update gigs, search/filter, seeding, etc.). It exposes REST APIs through the API Gateway, persists data in MongoDB, consumes domain events from RabbitMQ, and logs to Elasticsearch. Optional Elastic APM can be enabled for tracing.

---

## Responsibilities
- CRUD for gig listings and metadata
- JWT-based request authentication (validated per request)
- Consume seed and gig-related messages from RabbitMQ
- Centralized logging to Elasticsearch; optional APM

## Architecture & Dependencies
- Runtime: Node.js 18+, TypeScript
- Framework: Express
- Database: MongoDB
- Messaging: RabbitMQ
- Cache/coordination: Redis (used by service logic/queues)
- Observability: Elasticsearch + optional Elastic APM

## Ports
- HTTP: 4004

## Environment Variables
Defined in `src/config.ts`:
- NODE_ENV: `development` | `production` | `test`
- API_GATEWAY_URL: Allowed CORS origin from Gateway
- JWT_TOKEN: JWT verification secret used in request middleware
- GATEWAY_JWT_TOKEN: Token for service-to-service calls (if applicable)
- SECRET_KEY_ONE, SECRET_KEY_TWO: Crypto/session secrets
- DATABASE_URL: MongoDB connection string (e.g., `mongodb://localhost:27017/gigconnect_gigs`)
- ELASTIC_SEARCH_URL: Elasticsearch HTTP endpoint for logs
- RABBITMQ_ENDPOINT: AMQP URL (e.g., `amqp://gigconnect:Qwerty123@localhost:5672`)
- REDIS_HOST: Redis connection URL (e.g., `redis://localhost:6379`)
- CLOUD_NAME, CLOUD_API_KEY, CLOUD_API_SECRET: Cloudinary credentials (for image assets if used)
- ENABLE_APM: `1` to enable Elastic APM
- ELASTIC_APM_SERVER_URL, ELASTIC_APM_SECRET_TOKEN: APM settings

## Message Flows (RabbitMQ)
Consumers initialized in `src/server.ts` via `gig.consumer.ts`:
- `consumeSeedDirectMessages`
- `consumeGigDirectMessage`

Queue/exchange details are defined in the consumer/connection code. Ensure publishers use matching exchanges and routing keys.

## NPM Scripts
- dev: `nodemon`
- build: `tsc` + `tsc-alias`
- start: PM2 start of compiled build
- test: Jest
- lint/format: eslint + prettier

## Running Locally

### Prerequisites
- MongoDB
- RabbitMQ
- Elasticsearch (optional but recommended)

### Docker Compose (infra)
```
docker compose -f volumes/docker-compose.yaml up -d mongo rabbitmq elasticsearch kibana apm-server
```

### Configure .env
```
NODE_ENV=development
API_GATEWAY_URL=http://localhost:4000
JWT_TOKEN=supersecretjwt
GATEWAY_JWT_TOKEN=gateway-gigs-token
SECRET_KEY_ONE=secret-one
SECRET_KEY_TWO=secret-two
DATABASE_URL=mongodb://localhost:27017/gigconnect_gigs
ELASTIC_SEARCH_URL=http://elastic:admin1234@localhost:9200
RABBITMQ_ENDPOINT=amqp://gigconnect:Qwerty123@localhost:5672
REDIS_HOST=redis://localhost:6379
CLOUD_NAME=
CLOUD_API_KEY=
CLOUD_API_SECRET=
ENABLE_APM=0
ELASTIC_APM_SERVER_URL=http://localhost:8200
ELASTIC_APM_SECRET_TOKEN=
```

### Start
- Dev: `npm run dev`
- Prod: `npm run build && npm run start`

## Security
- CORS restricted to `API_GATEWAY_URL`
- Helmet & HPP enabled
- JWT verification middleware for protected routes
- Secrets stored in secret manager in production

## Observability
- Logs to Elasticsearch via `@kariru-k/gigconnect-shared`
- Elastic APM optional (`ENABLE_APM=1`)

## Troubleshooting
- 401/403: verify `JWT_TOKEN` and authorization header
- Mongo connection issues: verify `DATABASE_URL`
- Queue consumers idle: verify `RABBITMQ_ENDPOINT` and exchange/routing keys
- Missing logs: check `ELASTIC_SEARCH_URL`
