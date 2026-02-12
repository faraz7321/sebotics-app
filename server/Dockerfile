# Base image
FROM node:22-bullseye-slim

# Create app directory
WORKDIR /server

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

# ensure OpenSSL is available for Prisma native engines
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# generate prisma client for the container runtime
RUN npx prisma generate

# Copy the .env file
COPY .env ./

# Creates a "dist" folder with the production build
RUN npm run build

# Expose the port on which the app will run
EXPOSE 3001

# Start the server using the production build
CMD ["npm", "run", "start"]
