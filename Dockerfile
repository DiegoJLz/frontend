# Etapa de dependencias
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install
RUN npm install geist

# Etapa de desarrollo
FROM node:18-alpine AS development
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV development
ENV NEXT_TELEMETRY_DISABLED 1
CMD ["npm", "run", "dev"]

# Etapa de construcción
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Etapa de producción
FROM node:18-alpine AS production
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Crear usuario no root para mejor seguridad
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar solo los archivos necesarios
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Configurar permisos
USER nextjs

# Exponer puerto y configurar variables de entorno
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Comando para iniciar la aplicación
CMD ["node", "server.js"]