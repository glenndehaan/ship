#
# Define OS
#
FROM alpine:3.14

#
# Basic OS management
#

# Install packages
RUN apk add --no-cache nodejs npm

#
# Setup app
#

# Create app directory
WORKDIR /app

# Expose app
EXPOSE 3000

# Set node env
ENV NODE_ENV=production

# Setup healthcheck
HEALTHCHECK --interval=1m --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Run app
CMD ["node", "/app/src/server.js"]

# Bundle package.json and package-lock.json source
COPY ./package.json ./package-lock.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

#
# Require app (image caching from this point is not possible anymore)
#

# Bundle app source
COPY . .

# Create production build
RUN npm run build
