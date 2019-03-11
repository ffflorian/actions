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
    GIT_USER = "<git username>"
    # if you don't specify GIT_EMAIL, it will use GitHub's default
    # no-reply email address for the specified username
    GIT_EMAIL = "<git email address>"
  }
  # you can also use "GITHUB_TOKEN" instead of "GH_TOKEN"
  secrets = ["NPM_AUTH_TOKEN", "GH_TOKEN"]
}
```
