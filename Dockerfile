# with help from https://docs.docker.com/guides/nodejs/containerize/

# ARG NODE_VERSION=24-alpine
ARG NODE_VERSION=24-trixie-slim

#### BASE ####
FROM node:${NODE_VERSION} AS base

# non-root user for security alpine
# RUN addgroup -g 1001 -S nodejs && \
#     adduser -S nodejs -u 1001 -G nodejs

# non-root user for security
RUN addgroup --gid 1001 nodejs && \
    adduser --uid 1001 --gid 1001 nodejs

# install java jdk headless alpine
# RUN apk add --no-cache openjdk8-jre-base

# install libreoffice alpine
# RUN apk add --no-cache libreoffice-common libreoffice-writer

# install libreoffice writer (headless) debian trixie
RUN apt-get update
RUN apt-get -y -qq --no-install-recommends install libreoffice-writer-nogui


# basic fonts alpine https://wiki.alpinelinux.org/wiki/Fonts
# RUN apk add --no-cache font-terminus font-inconsolata font-dejavu font-noto font-noto-cjk font-awesome font-noto-extra

# microsoft core fonts (very large) alpine
#RUN apk add --no-cache msttcorefonts-installer fontconfig && \
#  update-ms-fonts && fc-cache -f

# fonts trixie libreoffice recommends
RUN apt-get install -y -qq --no-install-recommends \
    fonts-crosextra-caladea \
    fonts-crosextra-carlito \
    fonts-dejavu \
    fonts-liberation \
    fonts-liberation2 \
    fonts-linuxlibertine \
    fonts-noto-cjk \
    fonts-noto-core \
    fonts-noto-mono \
    fonts-noto-ui-core \
    fonts-sil-gentium \
    fonts-sil-gentium-basic


# clear cache alpine
# RUN rm -rf /var/cache/apk/*

# clear cache trixie
RUN apt-get clean
# cleanup trixie
RUN rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*


WORKDIR /app

COPY . .



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


