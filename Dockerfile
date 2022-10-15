# First stage: compile things.
FROM node:16.13.1 AS build
WORKDIR /usr/src/app

COPY package.json .
RUN yarn
RUN yarn global add typescript

# Copy the rest of the application in and build it.
COPY . .
# RUN npm build
RUN tsc

# Now /usr/src/app/dist has the built files.

# Second stage: run things.
FROM node:16.13.1 as run
WORKDIR /usr/src/app

# (Install OS dependencies; just libraries.)

# Install the Javascript dependencies, only runtime libraries.
COPY package.json .
RUN yarn --production
RUN yarn global add pm2

# Copy the dist tree from the first stage.
COPY --from=build /usr/src/app/dist /usr/src/app/dist

ENV NODE_PATH=/usr/src/app/dist

# Run the built application when the container starts.
EXPOSE 8090
EXPOSE 13337
CMD ["pm2-runtime","./dist/server.js"]
