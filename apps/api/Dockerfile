# Use the official Bun image
FROM oven/bun:1 as builder

# Set working directory
WORKDIR /app

# Copy the entire repository
COPY . .

# Set working directory to the API app
WORKDIR /app/apps/api

# Install dependencies
RUN bun install --frozen-lockfile

# Build the application
RUN bun run build

# Production stage
FROM oven/bun:1-slim

# Set working directory
WORKDIR /app

# Copy built files from builder
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/apps/api/bun.lockb ./

# Install production dependencies
RUN bun install --frozen-lockfile --production

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start the application
CMD ["bun", "run", "dist/index.js"]
