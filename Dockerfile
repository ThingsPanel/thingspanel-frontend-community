FROM nginx:latest
# RUN rm -rf /etc/nginx/nginx.conf
# RUN rm -rf /usr/share/nginx/html/*
# RUN mkdir -p /usr/share/nginx/html/discount-web
COPY dist /usr/share/nginx/html/
COPY visual-editor/dist /usr/share/nginx/visual-editor
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080
ENTRYPOINT nginx -g "daemon off;"
