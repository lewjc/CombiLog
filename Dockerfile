# First stage: compile things.
FROM node:16.16.0 AS build
WORKDIR /usr/src/app

# (Install OS dependencies; include -dev packages if needed.)

# Install the Javascript dependencies, including all devDependencies.
COPY package.json .
RUN npm install

# Copy the rest of the application in and build it.
COPY . .
# RUN npm build
RUN npx tsc -p ./tsconfig.json

# Now /usr/src/app/dist has the built files.

# Second stage: run things.
FROM node:16.16.0
WORKDIR /usr/src/app

# (Install OS dependencies; just libraries.)

# Install the Javascript dependencies, only runtime libraries.
COPY package.json .
RUN npm install --production
RUN npm install pm2 -g

# Copy the dist tree from the first stage.
COPY --from=build /usr/src/app/dist /usr/src/app/dist

# Run the built application when the container starts.
EXPOSE 8090
EXPOSE 13337
CMD ["pm2-runtime","./dist/server.js"]
