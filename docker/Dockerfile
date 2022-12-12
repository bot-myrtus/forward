FROM --platform=$BUILDPLATFORM alpine
ARG LINK
ARG TARGETPLATFORM
COPY ./setup.sh /setup.sh
RUN /setup.sh

FROM node:lts-alpine
COPY --from=0 /koishi /koishi
WORKDIR /koishi
ENTRYPOINT [ "yarn", "start" ]
