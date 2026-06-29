# Use official Node image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy remaining code
COPY . .

# Expose your app port
EXPOSE 8012

# Start the app
CMD ["npm", "start"]