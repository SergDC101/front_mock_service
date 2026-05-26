# Этап 1: Сборка приложения
FROM node:20-alpine AS build-stage

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файлы package.json и package-lock.json (или yarn.lock)
COPY package*.json ./

# Устанавливаем зависимости
RUN npm i

# Копируем остальные файлы проекта
COPY . .

# Собираем приложение
RUN npm run build

# Этап 2: Запуск с Nginx
FROM nginx:stable-alpine AS production-stage

# Копируем собранные файлы из этапа сборки
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Копируем кастомную конфигурацию Nginx (опционально)
# COPY nginx.conf /etc/nginx/nginx.conf

# Открываем порт 80
EXPOSE 80

# Запускаем Nginx
CMD ["nginx", "-g", "daemon off;"]