FROM alpine/git:latest

LABEL version="1.0.0"
LABEL repository="https://github.com/ffflorian/actions/tree/master/skip-ci-check"
LABEL homepage="https://github.com/ffflorian/actions/tree/master/skip-ci-check"
LABEL maintainer="ffflorian"

LABEL com.github.actions.name="GitHub Action for CI skipping check"
LABEL com.github.actions.description="Checks if the last commit should trigger a CI skip"
LABEL com.github.actions.icon="package"
LABEL com.github.actions.color="yellow"

COPY "entrypoint.sh" "/entrypoint.sh"

ENTRYPOINT ["/entrypoint.sh"]
