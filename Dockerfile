# Package the verified production bundle: pnpm install --frozen-lockfile && pnpm build
# Then: docker build -t thingspanel-frontend .
FROM nginx:latest

COPY dist /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080
ENTRYPOINT nginx -g "daemon off;"