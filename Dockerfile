FROM node:24-bookworm-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY src ./src
COPY scripts ./scripts
COPY dist ./dist
RUN mkdir /app/data && chown -R node:node /app
USER node
ENV HOST=0.0.0.0 PORT=8788 DATA_DIR=/app/data NODE_ENV=production
EXPOSE 8788
CMD ["node", "--env-file-if-exists=.env", "src/server.mjs"]
