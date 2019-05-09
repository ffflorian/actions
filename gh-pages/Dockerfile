FROM node:12-alpine

LABEL version="1.0.0"
LABEL repository="https://github.com/ffflorian/actions/tree/master/gh-pages"
LABEL homepage="https://github.com/ffflorian/actions/tree/master/gh-pages"
LABEL maintainer="ffflorian"

LABEL com.github.actions.name="GitHub Action for gh-pages"
LABEL com.github.actions.description="Wraps the gh-pages CLI to enable common gh-pages commands."
LABEL com.github.actions.icon="package"
LABEL com.github.actions.color="yellow"

RUN apk add --no-cache git

COPY "entrypoint.sh" "/entrypoint.sh"

ENTRYPOINT ["/entrypoint.sh"]
