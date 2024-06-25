# Stage 1: Install the dependencies ########################################
FROM node:20-alpine3.19@sha256:f28ec01ebb46af85d5a5c02f59296ccc494386da07d0a447a1b9f58fc8642167 AS dependencies

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --production
############################################################################

# Stage 2: Copy the application files ######################################
FROM node:20-alpine3.19@sha256:f28ec01ebb46af85d5a5c02f59296ccc494386da07d0a447a1b9f58fc8642167 AS builder

WORKDIR /app

# Copying the dependencies from Stage 1 to /application
COPY --from=dependencies /app /app

# Copying the source code
COPY --chown=node:node ./src ./src
COPY ./tests/.htpasswd ./tests/.htpasswd
############################################################################

# Stage 3: Start the server and keep running the health check
FROM node:20-alpine3.19@sha256:f28ec01ebb46af85d5a5c02f59296ccc494386da07d0a447a1b9f58fc8642167

LABEL maintainer="Gaganjot Singh <jotgumber2002@gmail.com>"
LABEL description="Fragments node.js microservice"

ENV PORT=8080 \
    NPM_CONFIG_LOGLEVEL=warn \
    NPM_CONFIG_COLOR=false \
    NODE_ENV=production

WORKDIR /app

# Install curl
RUN apk update
RUN apk add curl


# Copying the application from development stage!
COPY --from=builder /app /app

# Switch user to node
USER node

CMD npm start

EXPOSE 8080

# Keeping the healthcheck running to make sure it alerts in case of any server errors!
HEALTHCHECK --interval=15s --timeout=30s --start-period=10s --retries=3 \
  CMD curl --fail localhost:8080 || exit 1
############################################################################
