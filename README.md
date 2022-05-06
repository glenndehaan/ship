# Ship

[![Image Size](https://img.shields.io/docker/image-size/glenndehaan/ship)](https://hub.docker.com/r/glenndehaan/ship)

![Ship Overview Page](https://user-images.githubusercontent.com/7496187/166507961-d0b91c35-20e1-43f1-a71e-8291266ba4fa.png)

## What is it?
Ship is a simple stack/service manager for Docker Swarm.
It allows for example: Development teams to deploy new image version to a Docker Swarm Cluster.
Developers are then also able to see the logs for either the service or connected tasks for easy debugging.

It also provides an option to scale services and force re-deploy services.

## Development Usage
Make sure you have Node.JS 14.x installed then run the following commands in your terminal:
```text
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
      # Can be used to enable custom webhooks to forward Ship events to other services
      # CUSTOM_WEBHOOK: 'https://webhook1.exmaple.com/hook,https://webhook2.exmaple.com/hook'
      # Can be used to enable slack notifications whenever an action on ship is performed
      # SLACK_WEBHOOK: ''
      # Can be used to enable email notifications whenever an action on ship is performed
      # EMAIL_SMTP_HOST: 'smtp.example.com'
      # EMAIL_SMTP_PORT: '25'
      # EMAIL_SMTP_SECURE: 'false'
      # EMAIL_FROM: 'noreply@example.com'
      # EMAIL_TO: 'user1@example.com,user2@example.com'
      # Can be used to disable service modifications during specific days/times
      # LOCKOUT_EXCEPTIONS: 'user@example.com' # Specifies usernames who can bypass the lockout rules
      # LOCKOUT_SERVICE_REGEX: '.*-live' # Specifies which services are affected by the lockout rules
      # LOCKOUT_DAYS: '0,5,6' # Disallow specific days: 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
      # LOCKOUT_AFTER_HOUR: '' # Disallow modifications after a specified hour
      # Can be enabled to include debug data as JS window parameters
      # DEBUG_DOCKER: 'true'
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - /opt/ship_data:/data
```

* Run `docker stack deploy -c ship-stack.yml ship` this pulls ship and starts it on the docker swarm

## Custom Webhooks
Ship can forward events to other services through the help of webhooks (POST Request).
Below you will find an example payload of what you can expect:
```json
{
  "type": "force_update",
  "username": "Anonymous",
  "service": "test_test",
  "params": {},
  "time": 1651821585213
}
```

Below are some options that get send with different events:
```text
{
  "type": "attempt_update | update | attempt_force_update | force_update | attempt_scale | scale",
  "username": "Anonymous | Authenticated User Email/Username",
  "service": "stack_service",
  "params": {
    image: "library/repo", // Only gets send with type: update
    old_image_version: "latest | tag", // Only gets send with type: update
    new_image_version: "latest | tag" // Only gets send with type: update
  },
  "time": 0
}
```

## Screenshots

### Service Logs/Task Logs
![Service Logs](https://user-images.githubusercontent.com/7496187/166507958-df784e85-f2f9-4474-93dd-deb3953bb0a8.png)

### Update the service image
![Update Service](https://user-images.githubusercontent.com/7496187/166507957-5434a566-3a1f-48bd-b4dc-cef53b0f8822.png)

### Force Update/Re-deploy Service
![Force Update Service](https://user-images.githubusercontent.com/7496187/166507955-8d0b1f43-da22-465d-8a06-12423d4ab9c0.png)

### Scale Service
![Scale Service](https://user-images.githubusercontent.com/7496187/166507952-241dd665-96c3-4c69-9ae8-e34e6ec486f7.png)

### Email Notification
![Email Notification](https://user-images.githubusercontent.com/7496187/166509782-187f44da-8dde-4dfd-8d54-53f4b0b0f049.png)

### Slack Notification
Coming Soon!

## License

MIT
