# Ship

[![Image Size](https://img.shields.io/docker/image-size/glenndehaan/ship)](https://hub.docker.com/r/glenndehaan/ship)

![Ship Overview Page](https://user-images.githubusercontent.com/7496187/158958023-e53869b3-9f7d-4d28-8664-a45200a86b0f.png)

## What is it?
Ship is a simple stack/service manager for Docker Swarm.
It allows for example: Development teams to deploy new image version to a Docker Swarm Cluster.
Developers are then also able to see the logs for either the service or connected tasks for easy debugging.

It also provides an option to scale services and force re-deploy services.

## Development Usage
Make sure you have Node.JS 14.x installed then run the following commands in your terminal:
```
npm ci
npm run tailwind
npm run dev
```

> Please note that not all functions are available when running locally. Some functions are only available on a docker swarm instance

## Run ship in production
Ship is available for your own docker swarm cluster.
Follow the guide below to install the app onto your own cluster:

> We recommend you to use a reverse proxy like Traefik or Nginx in front of Ship

> Please note that right now Ship does not have built-in user management! So don't open up Ship to the outside world unless you are using for example an IP Whitelist

* Create a ship-stack.yml file with the following contents:
```yaml
version: '3.8'

services:
  ship:
    image: glenndehaan/ship:latest
    deploy:
      labels:
        # Example headers for the traefik v2 reverse proxy
        - traefik.enable=true
        - traefik.http.routers.ship.entrypoints=websecure
        - traefik.http.routers.ship.rule=Host(`ship.example.com`)
        - traefik.http.routers.ship.tls=true
        - traefik.http.services.ship.loadbalancer.server.port=3000
      placement:
        constraints:
          - node.role == manager
    environment:
      # Can be used to hide specific services from the ship overview page
      HIDDEN_SERVICES: 'ship_ship'
      # Defines the maximum allowed scale. This means you can't scale a service with more containers then this amount
      MAX_SCALE: '20'
      # Can be used to instruct Ship to use an SSO providers username header
      # AUTH_HEADER: ''
      # Can be enabled to include debug data as JS window parameters
      # DEBUG_DOCKER: 'true'
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - /opt/ship/ship.json:/data/ship.json
```

* Run `docker stack deploy -c ship-stack.yml ship` this pulls ship and starts it on the docker swarm

## Screenshots

### Service Logs/Task Logs
![Service Logs](https://user-images.githubusercontent.com/7496187/158958271-e45e5696-271b-4aaf-ac50-f235f810749d.png)

### Update the service image
![Update Service](https://user-images.githubusercontent.com/7496187/158958267-a22426ad-00f0-4a77-ba7d-37e7c38bb1c0.png)

### Force Update/Re-deploy Service
![Force Update Service](https://user-images.githubusercontent.com/7496187/158958259-f57758e3-13fc-4465-bd83-3a6a6ab0ab0e.png)

### Scale Service
![Scale Service](https://user-images.githubusercontent.com/7496187/158958249-a7853f8e-56bd-44f1-97c6-380b8884460b.png)

## License

MIT
