# Use the official Node.js 20 base image
FROM node:20

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json, package-lock.json, and the remaining app files to the working directory
COPY package*.json ./

# Copy the entire node_modules directory from local environment to the working directory in the Docker image
RUN npm install --save-dev @types/lodash
# COPY node_modules ./node_modules

# Install TypeScript declarations for lodash (already installed in local node_modules)


# Copy the rest of the app files to the working directory
COPY . .

# Build the app
RUN npm run build

# Expose the port that the app will run on
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
