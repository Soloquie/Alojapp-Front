# Etapa 1: Construcción de la app Angular
FROM node:22-alpine AS build

WORKDIR /app

# Copiamos los archivos de dependencias
COPY package*.json ./

# Instalamos dependencias
RUN npm ci

# Copiamos el resto del código
COPY . .

# Desactivamos el "font inlining" forzando modo sin conexión
ENV NG_CLI_ANALYTICS=false
ENV NODE_OPTIONS=--max_old_space_size=4096

# Compilamos la aplicación sin intentar descargar fuentes externas
RUN npx ng build --configuration production --verbose --no-progress

# Etapa 2: Servir con Nginx
FROM nginx:alpine

# Copiamos el resultado de la compilación
COPY --from=build /app/dist/alojapp/browser /usr/share/nginx/html

# Exponemos el puerto 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
