# @ffflorian/actions

### Example actions

```workflow
action "Last Commit does not include '[skip ci']" {
  uses = "ffflorian/actions/last_commit@master"
  args = "^(?:(?!\\[(ci skip|skip ci)\\]).)*$"
}

action "Last Commit does include 'fix(*):'" {
  uses = "ffflorian/actions/last_commit@master"
  args = "^fix([^)]+):.*"
}

action "Publish with lerna" {
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
```
