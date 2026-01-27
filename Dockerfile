# with help from https://docs.docker.com/guides/nodejs/containerize/

ARG NODE_VERSION=24-alpine

#### BASE ####
FROM node:${NODE_VERSION} AS base

WORKDIR /app

# install java jdk headless
RUN apk add --no-cache openjdk8-jre-base

# install libreoffice
RUN apk add --no-cache libreoffice-common libreoffice-writer

# basic fonts  https://wiki.alpinelinux.org/wiki/Fonts
RUN apk add --no-cache font-terminus font-inconsolata font-dejavu font-noto font-noto-cjk font-awesome font-noto-extra

# microsoft core fonts (very large)
#RUN apk add --no-cache msttcorefonts-installer fontconfig && \
#  update-ms-fonts && fc-cache -f

# clear cache
RUN rm -rf /var/cache/apk/*

COPY . .

# non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs


# TODO: add frontend


WORKDIR /app/to-backend

# "npm install" but with build optimizations
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm ci --no-audit --no-fund && \
    npm cache clean --force


# set owner
RUN chown -R nodejs:nodejs /app



#### DEVELOPMENT ####
FROM base AS development

ENV NODE_ENV=development

USER nodejs

CMD ["npm", "run", "dev-run-test-conversion"]


#### PRODUCTION ####
FROM base AS production

RUN npm run build

RUN chown -R nodejs:nodejs /app

USER nodejs

# TODO: add server execution from js ? maybe with npm ?


