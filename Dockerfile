


FROM node:16-alpine3.11 AS build
WORKDIR /app
COPY package.json yarn.lock ./
RUN YARN_REGISTRY="https://registry.yarnpkg.com" yarn install --frozen-lockfile 

COPY tsconfig.json ./
COPY src ./src
RUN YARN_REGISTRY="https://registry.yarnpkg.com" yarn build

FROM node:16-alpine3.11 AS run 
WORKDIR /app
COPY --from=build /app/node_modules/ /app/node_modules
COPY --from=build /app/dist/ /app/dist


CMD ["node", "dist/index.js"]


EXPOSE 8044/tcp