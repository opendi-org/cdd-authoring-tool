###############################
# HOW TO RUN:
# Use this command from within the project's top directory:
#       docker build -t cdd-tool .
###############################

###############################
# --BUILD THE NODE PROJECT
###############################

# This uses a temporary image and container. These won't stick around.

FROM node:20.14 as Build

WORKDIR /

# .dockerignore is configured so this will avoid copying local node_modules and build artifacts, which would take a while
COPY . .

# Install dependencies
RUN npm ci

# Build the program. Artifacts will go in /docs/ and /static/
RUN npm run build

###############################
# --CREATE THE LOCAL WEB SERVER
###############################

# Using basic nginx webserver image
# Just put the static build files in the expected folder, and they'll be served automatically.
# If you need to debug, run shell:
#   docker run -it cdd-tool sh
FROM nginx:alpine

# Only copy the build artifacts
COPY --from=build /docs/ /usr/share/nginx/html
COPY --from=build /static/ /usr/share/nginx/html

# Bind this to something like localhost:3000 on the host machine when run. See below.
EXPOSE 80

# Standard nginx serve command
CMD ["nginx", "-g", "daemon off;"]

###############################
# HOW TO RUN THE RESULT:
# On Docker Desktop, click the Play button to run the image. In Optional settings, set Host port in the Ports section to 3000
# For Docker command line, use this command:
#       docker run -p 3000:80 cdd-tool
###############################