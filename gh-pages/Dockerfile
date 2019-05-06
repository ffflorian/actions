FROM node:12-slim

LABEL version="1.0.0"
LABEL repository="https://github.com/ffflorian/actions/tree/master/gh-pages"
LABEL homepage="https://github.com/ffflorian/actions/tree/master/gh-pages"
LABEL maintainer="ffflorian"

LABEL com.github.actions.name="GitHub Action for gh-pages"
LABEL com.github.actions.description="Wraps the gh-pages CLI to enable common gh-pages commands."
LABEL com.github.actions.icon="package"
LABEL com.github.actions.color="yellow"

RUN apt-get update && \
    apt-get install --no-install-recommends -y \
        git && \
    apt-get clean -y && \
    rm -rf /var/lib/apt/lists/*

RUN yarn global add gh-pages@~2.0

COPY "entrypoint.sh" "/entrypoint.sh"

ENTRYPOINT ["/entrypoint.sh"]
