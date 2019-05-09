FROM node:12-alpine

LABEL version="1.0.0"
LABEL repository="https://github.com/ffflorian/actions/tree/master/semantic-release"
LABEL homepage="https://github.com/ffflorian/actions/tree/master/semantic-release"
LABEL maintainer="ffflorian"

LABEL com.github.actions.name="GitHub Action for semantic-release"
LABEL com.github.actions.description="Wraps the semantic-release CLI to enable common semantic-release commands."
LABEL com.github.actions.icon="package"
LABEL com.github.actions.color="yellow"

RUN apk add --no-cache git bash

COPY "entrypoint.sh" "/entrypoint.sh"

ENTRYPOINT ["/entrypoint.sh"]
