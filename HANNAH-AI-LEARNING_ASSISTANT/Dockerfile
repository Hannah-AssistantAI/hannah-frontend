# Stage 1: Build the React application
FROM node:20-alpine AS builder

# Install libc compatibility for native modules
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Build argument for API base URL - MUST be declared early
ARG VITE_API_BASE_URL=/api
# Set as environment variable so Vite can read it during build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Copy ONLY package.json (NOT package-lock.json to avoid platform issues)
COPY package.json ./

# Fresh install for Alpine Linux (linux-musl)
RUN npm install

# Copy source code
COPY . .

# Build the application (Vite will read VITE_API_BASE_URL from ENV)
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
