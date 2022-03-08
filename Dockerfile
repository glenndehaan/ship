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

# Run app
CMD ["node", "/app/src/server.js"]

# Bundle package.json and package-lock.json source
COPY ./package.json ./package-lock.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

#
# Require app
#

# Bundle app source
COPY . .

# Create production build
RUN npm run build
