# Step 1: Build Stage
FROM node:18 AS builder

# Set working directory
WORKDIR /app

# Copy package files first
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the entire Next.js project
COPY . .

# Build the Next.js app
RUN npm run build

# Step 2: Run Stage (Production)
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy built app from previous stage
COPY --from=builder /app ./

# Expose frontend port (default Next.js port is 3000)
EXPOSE 8080

# Start Next.js in production mode
CMD ["npm", "run", "start"]
