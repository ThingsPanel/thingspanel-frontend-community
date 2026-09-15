FROM --platform=$TARGETPLATFORM nginx:1.27-alpine
COPY dist /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
