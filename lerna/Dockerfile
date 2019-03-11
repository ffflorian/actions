FROM node:10-slim

LABEL version="1.0.0"
LABEL repository="https://github.com/ffflorian/actions/tree/master/lerna"
LABEL homepage="https://github.com/ffflorian/actions/tree/master/lerna"
LABEL maintainer="ffflorian"

LABEL com.github.actions.name="GitHub Action for Lerna"
LABEL com.github.actions.description="Wraps the Lerna CLI to enable common Lerna commands."
LABEL com.github.actions.icon="package"
LABEL com.github.actions.color="yellow"

RUN apt-get update && \
    apt-get install --no-install-recommends -y \
        git && \
    apt-get clean -y && \
    rm -rf /var/lib/apt/lists/*

RUN yarn global add lerna@~3.13

COPY "entrypoint.sh" "/entrypoint.sh"

ENTRYPOINT ["/entrypoint.sh"]
