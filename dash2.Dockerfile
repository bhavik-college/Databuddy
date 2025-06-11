# Build stage
FROM oven/bun:1-slim AS builder


# Copy dependency files
COPY package.json bun.lock turbo.json /app/
COPY apps/dash2 /app/dash2
COPY packages/ /app/packages

WORKDIR /app
# Install dependencies
RUN bun install 

# build dash2
WORKDIR /app/dash2
RUN bun install 
RUN bun run build

# Production stage
FROM oven/bun:1-slim

# Copy built files from builder
COPY --from=builder /apps/dash2 /app
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    BUN_ENV=production

# Expose port
EXPOSE 3000
# Start API
CMD ["bun", "run", "start"]