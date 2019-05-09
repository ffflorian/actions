workflow "Build, lint and test" {
  on = "push"
  resolves = "Test projects"
}

action "Don't skip CI" {
  uses = "./skip-ci-check"
}

action "Test projects" {
  needs = "Don't skip CI"
  uses = "./.github/actions/check-all-projects"
}
