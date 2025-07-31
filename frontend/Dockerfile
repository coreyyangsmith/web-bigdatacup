# Development stage
# Use debian-based Node image instead of Alpine to ensure rollup binary compatibility
FROM node:22

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port 5173 (default Vite dev server port)
EXPOSE 5173

# Start development server
CMD ["npm", "run", "dev", "--", "--host"]

