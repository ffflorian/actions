# @ffflorian/actions

### Example actions

```workflow
action "Last commit does not include '[skip ci]'" {
  uses = "ffflorian/actions/last_commit@master"
  args = "^(?:(?!\\[(ci skip|skip ci)\\]).)*$"
}

action "Last commit does include 'fix(*):'" {
  uses = "ffflorian/actions/last_commit@master"
  args = "^fix([^)]+):.*"
}

action "Publish with Lerna" {
  uses = "ffflorian/actions/lerna@master"
  args = "publish"
  env = {
    # required
    GH_USER = "<GitHub username>"

    # if you don't specify <GIT_NAME>, it will use <GH_USER>
    # as git name
    GIT_NAME = "<name>"

    # if you don't specify <GIT_EMAIL>, it will use GitHub's default
    # no-reply email address for the specified username
    GIT_EMAIL = "<email address>"
  }
  secrets = ["NPM_AUTH_TOKEN", "GH_TOKEN"]
}

action "Publish with gh-pages" {
  uses = "ffflorian/actions/gh-pages@master"
  args = "publish"
  env = {
    # required
    GH_USER = "<GitHub username>"

    # if you don't specify <GIT_NAME>, it will use <GH_USER>
    # as git name
    GIT_NAME = "<name>"

    # if you don't specify <GIT_EMAIL>, it will use GitHub's default
    # no-reply email address for the specified username
    GIT_EMAIL = "<email address>"
  }
  secrets = ["GH_TOKEN"]

action "Publish with semantic-release" {
  uses = "ffflorian/actions/semantic-release@master"
  env = {
    # required
    GH_USER = "<GitHub username>"

    # if you don't specify <GIT_NAME>, it will use <GH_USER>
    # as git name
    GIT_NAME = "<name>"

    # if you don't specify <GIT_EMAIL>, it will use GitHub's default
    # no-reply email address for the specified username
    GIT_EMAIL = "<email address>"
  }
  secrets = ["NPM_AUTH_TOKEN", "GH_TOKEN"]
}
```
