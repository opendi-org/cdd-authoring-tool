###############################
# HOW TO RUN:
# Use this command from within the project's top directory:
#       docker build -t cdd-tool .
###############################

###############################
# --BUILD THE NODE PROJECT
###############################

# This uses a temporary image and container. These won't stick around.

FROM node:20.14 AS build

WORKDIR /

# .dockerignore is configured so this will avoid copying local node_modules and build artifacts, which would take a while
COPY . .

# Replace static config with the API-friendly docker config file
RUN rm -f ./src/config.js
RUN cp ./docker-config.js ./src/config.js

# Install dependencies
RUN npm ci

# Build the program. Artifacts will go in /docs/ and /static/
RUN npm run build

###############################
# --CREATE THE LOCAL WEB SERVER
###############################

# Using basic apache webserver image
# Just put the static build files in the expected folder, and they'll be served.
# If you need to debug, run shell:
#   docker run -it cdd-tool sh
FROM httpd:2.4

# Only copy the build artifacts
WORKDIR /usr/local/apache2/htdocs/
COPY --from=build /docs/ .
COPY --from=build /static/ .

EXPOSE 80

# Apache run command
CMD ["httpd-foreground"]