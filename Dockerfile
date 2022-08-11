# 拉取基础镜像环境
FROM node:16.14-alpine3.14 as NodeBuilder
# 该文件的拥有者
MAINTAINER XXX

ENV HOST_IP=localhost

RUN mkdir -p /opt/web
COPY . /opt/web
WORKDIR /opt/web


# 淘宝镜像
RUN npm i -g cnpm --registry=https://registry.npm.taobao.org
RUN cnpm install -g http-server
RUN cnpm install
RUN rm .env.dev
RUN rm .env.production
RUN cnpm run build



FROM nginx:latest
RUN rm -rf /etc/nginx/nginx.conf
RUN rm -rf /usr/share/nginx/html/*
#RUN mkdir -p /usr/share/nginx/html/discount-web
COPY --from=NodeBuilder /opt/web/dist/ /usr/share/nginx/html/
COPY --from=NodeBuilder /opt/web/nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080
ENTRYPOINT nginx -g "daemon off;"
