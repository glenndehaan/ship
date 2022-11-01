#=====================================================
# Build Stage (1/2)
#=====================================================

#
# Define OS
#
FROM alpine:3.15 AS build

#
# Basic OS management
#

# Install packages
RUN apk add --no-cache nodejs npm

#
# Require app
#

# Create app directory
WORKDIR /app

# Bundle application source
COPY . .

#=====================================================
# Build Stage (2/2)
#=====================================================

#
# Define OS
#
FROM alpine:3.15 AS build-prod

#
# Basic OS management
#

# Install packages
RUN apk add --no-cache nodejs npm

#
# Require app
#

# Create app directory
WORKDIR /app

# Bundle package.json and package-lock.json
COPY ./package.json ./package-lock.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

#=====================================================
# Image Stage
#=====================================================

#
# Define OS
#
FROM alpine:3.15

#
# Basic OS management
#

# Install packages
RUN apk add --no-cache dumb-init nodejs

#
# Setup app
#

# Create app directory
WORKDIR /app

# Set node env
ENV NODE_ENV=production

# Run app
CMD ["dumb-init", "node", "/app/src/server.js"]

#
# Bundle app
#

# Bundle from build image
COPY --from=build-prod /app/node_modules ./node_modules
COPY --from=build /app/src ./src
