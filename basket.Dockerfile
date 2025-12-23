FROM oven/bun:1.3.4-debian AS build

WORKDIR /app

RUN apt-get update && apt-get install -y \
	python3 \
	make \
	g++ \
	&& rm -rf /var/lib/apt/lists/*

COPY package.json package.json
COPY apps/basket/package.json ./apps/basket/package.json
COPY packages/*/package.json ./packages/

COPY packages/ ./packages/

RUN bun install

COPY apps/basket/src ./apps/basket/src
COPY apps/basket/tsconfig.json ./apps/basket/tsconfig.json

ENV NODE_ENV=production

WORKDIR /app/apps/basket

RUN bun build \
	--compile \
	--minify \
	--target bun \
	--outfile /app/server \
	--sourcemap \
	--bytecode \
	./src/index.ts

FROM gcr.io/distroless/base

WORKDIR /app

COPY --from=build /app/server server

ENV NODE_ENV=production

CMD ["./server"]

EXPOSE 4000