FROM jess/shellcheck

LABEL version="1.0.0"
LABEL repository="https://github.com/ffflorian/actions/tree/master/.github/actions/check-all-projects"
LABEL homepage="https://github.com/ffflorian/actions/tree/master/.github/actions/check-all-projects"
LABEL maintainer="ffflorian"

LABEL com.github.actions.name="shellcheck for GitHub Actions"
LABEL com.github.actions.description="Run shellcheck in GitHub Actions"
LABEL com.github.actions.icon="package"
LABEL com.github.actions.color="yellow"

COPY entrypoint.sh /

ENTRYPOINT ["/entrypoint.sh"]
