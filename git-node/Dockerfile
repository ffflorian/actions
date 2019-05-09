FROM node:12-alpine

LABEL version="1.0.0"
LABEL repository="https://github.com/ffflorian/actions/tree/master/git-node"
LABEL homepage="https://github.com/ffflorian/actions/tree/master/git-node"
LABEL maintainer="ffflorian"

LABEL com.github.actions.name="GitHub Action for git with Node.js"
LABEL com.github.actions.description="Sets up an environment with Node.js and git."
LABEL com.github.actions.icon="package"
LABEL com.github.actions.color="yellow"

RUN apk add --no-cache git bash

COPY "entrypoint.sh" "/entrypoint.sh"

ENTRYPOINT ["/entrypoint.sh"]
