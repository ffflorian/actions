# [1.23.0](https://github.com/ffflorian/actions/compare/v1.22.0...v1.23.0) (2026-05-30)


### Features

* **yarn-update:** add optional assignee and reviewer inputs ([#38](https://github.com/ffflorian/actions/issues/38)) ([33cc7b4](https://github.com/ffflorian/actions/commit/33cc7b4e05e9a6fca58a82d1c6f86cc39192835a))

# [1.22.0](https://github.com/ffflorian/actions/compare/v1.21.3...v1.22.0) (2026-05-29)


### Features

* **force-release:** Create full configuration ([fa96f94](https://github.com/ffflorian/actions/commit/fa96f940e87a9dcb92f050faf3c8f38154d3a5d0))

## [1.21.3](https://github.com/ffflorian/actions/compare/v1.21.2...v1.21.3) (2026-05-29)


### Bug Fixes

* **force-release:** Add release-notes-generator and apply the forced rules on it ([37a2bfc](https://github.com/ffflorian/actions/commit/37a2bfc28403d433e62671d8ae442918aed2e436))

## [1.21.2](https://github.com/ffflorian/actions/compare/v1.21.1...v1.21.2) (2026-05-29)


### Bug Fixes

* **force-release:** Log config before running semantic-release ([96c109c](https://github.com/ffflorian/actions/commit/96c109ce472aa9c8ecbe813808db95b11cfe5a6f))

## [1.21.1](https://github.com/ffflorian/actions/compare/v1.21.0...v1.21.1) (2026-05-29)


### Bug Fixes

* **force-release:** Install @semantic-release/git ([ce082b8](https://github.com/ffflorian/actions/commit/ce082b803deccea682b1f7bc8c1a47ecf24c79a7))

# [1.21.0](https://github.com/ffflorian/actions/compare/v1.20.0...v1.21.0) (2026-05-29)


### Features

* **force-release:** Install semantic-release while running ([8e58745](https://github.com/ffflorian/actions/commit/8e58745dc8dd357105eaada5c9f539a42370446c))

# [1.20.0](https://github.com/ffflorian/actions/compare/v1.19.4...v1.20.0) (2026-05-28)


### Bug Fixes

* **hugo-theme-update:** fix tests ([5a9b682](https://github.com/ffflorian/actions/commit/5a9b68209501e521853fcceaa9f4a3548d53c08f))


### Features

* **hugo-theme-update:** Update PR if it already exists ([535043d](https://github.com/ffflorian/actions/commit/535043d2ea372c39e195419e940ba314c6970107))
* **yarn-update:** Update PR if it already exists ([7e1ba30](https://github.com/ffflorian/actions/commit/7e1ba30116618906177738fafc4318d0abdb0a82))

## [1.19.4](https://github.com/ffflorian/actions/compare/v1.19.3...v1.19.4) (2026-05-28)


### Bug Fixes

* **hugo-theme-update,yarn-update:** git push with real force ([c656409](https://github.com/ffflorian/actions/commit/c656409264de054aa069b01d7d2c637500830465))

## [1.19.3](https://github.com/ffflorian/actions/compare/v1.19.2...v1.19.3) (2026-05-28)


### Bug Fixes

* **yarn-update:** git push with force ([03f6299](https://github.com/ffflorian/actions/commit/03f6299a5f13de8bd2ee421148f0e3eda0a18e04))

## [1.19.2](https://github.com/ffflorian/actions/compare/v1.19.1...v1.19.2) (2026-05-28)


### Bug Fixes

* **yarn-update:** Fail if GITHUB_TOKEN is not set ([119738b](https://github.com/ffflorian/actions/commit/119738bdd12deb7c94ee549af9236c1a0df5850e))

## [1.19.1](https://github.com/ffflorian/actions/compare/v1.19.0...v1.19.1) (2026-05-28)


### Bug Fixes

* **yarn-update:** document GITHUB_TOKEN env requirement ([#35](https://github.com/ffflorian/actions/issues/35)) ([43fd95b](https://github.com/ffflorian/actions/commit/43fd95bad2813343c3b13a1454bd11b41a9f10fa))

# [1.19.0](https://github.com/ffflorian/actions/compare/v1.18.6...v1.19.0) (2026-05-27)


### Features

* **docker-image-release:** Expose semantic-release outputs ([#34](https://github.com/ffflorian/actions/issues/34)) ([ddc0229](https://github.com/ffflorian/actions/commit/ddc0229952ce255a0f9cf64174504be47b355054))

## [1.18.6](https://github.com/ffflorian/actions/compare/v1.18.5...v1.18.6) (2026-05-27)


### Bug Fixes

* Release config and readme ([6d2e516](https://github.com/ffflorian/actions/commit/6d2e5164d14eefab6cb76fd166171867242eb988))

## [1.18.5](https://github.com/ffflorian/actions/compare/v1.18.4...v1.18.5) (2026-05-27)


### Bug Fixes

* **docker-image-release:** Correct semantic-release config ([98f6878](https://github.com/ffflorian/actions/commit/98f68781b63ff983c04aa2373b6fe7ddc5167df8))

## [1.18.4](https://github.com/ffflorian/actions/compare/v1.18.3...v1.18.4) (2026-05-27)


### Bug Fixes

* **github-action-release:** Correct semantic-release-config ([8fc4912](https://github.com/ffflorian/actions/commit/8fc4912701e6e2df9fcf48043aedce072980a48b))

## [1.18.3](https://github.com/ffflorian/actions/compare/v1.18.2...v1.18.3) (2026-05-27)


### Bug Fixes

* **docker-image-release:** Only publish Docker image if a new version was released ([677199e](https://github.com/ffflorian/actions/commit/677199e3c429c74e8033943099881f7fc6260700))

## [1.18.2](https://github.com/ffflorian/actions/compare/v1.18.1...v1.18.2) (2026-05-27)


### Bug Fixes

* **docker-image-release,github-action-release:** Add GitHub token to environment ([2162304](https://github.com/ffflorian/actions/commit/216230437cca7f50c9b8ed0492b75be089f36f13))

## [1.18.1](https://github.com/ffflorian/actions/compare/v1.18.0...v1.18.1) (2026-05-27)


### Bug Fixes

* **docker-image-release:** Extract metadata only once ([7af7ec5](https://github.com/ffflorian/actions/commit/7af7ec502279d6ad4e075c172e87a5cf9034088f))

# [1.18.0](https://github.com/ffflorian/actions/compare/v1.17.0...v1.18.0) (2026-05-27)


### Features

* **docker-image-release:** Add input for docker image name ([e8f6fce](https://github.com/ffflorian/actions/commit/e8f6fce325eb3650f7df5a87e041d3b9f2a73758))

# [1.17.0](https://github.com/ffflorian/actions/compare/v1.16.1...v1.17.0) (2026-05-27)


### Features

* **docker-image-release:** Add docker-image-release action ([#33](https://github.com/ffflorian/actions/issues/33)) ([aecb72a](https://github.com/ffflorian/actions/commit/aecb72a877d51a3a8fc65c5bd0b4d9642e9843e6))

## [1.16.1](https://github.com/ffflorian/actions/compare/v1.16.0...v1.16.1) (2026-05-27)


### Bug Fixes

* **github-action-release:** Set CHANGELOG.md as default asset ([8e0d887](https://github.com/ffflorian/actions/commit/8e0d8874e60a6885a441aee39b1e3ba3467e0417))

# [1.16.0](https://github.com/ffflorian/actions/compare/v1.15.0...v1.16.0) (2026-05-27)


### Features

* **force-release:** Rewrite in TypeScript and run semantic-release ([#32](https://github.com/ffflorian/actions/issues/32)) ([28da486](https://github.com/ffflorian/actions/commit/28da486e68caec9e6829fae8ddb6773bf9896a24))

# [1.15.0](https://github.com/ffflorian/actions/compare/v1.14.2...v1.15.0) (2026-05-25)


### Features

* **github-action-release:** Add configurable publish_files input ([#28](https://github.com/ffflorian/actions/issues/28)) ([9ec9f72](https://github.com/ffflorian/actions/commit/9ec9f72a73fdb213ff49531c88fde2242fe858f5))

## [1.14.2](https://github.com/ffflorian/actions/compare/v1.14.1...v1.14.2) (2026-05-24)


### Bug Fixes

* **coolify-deploy:** Rebuild action ([6ba7d76](https://github.com/ffflorian/actions/commit/6ba7d76924e940686fc8813fdc3f745ae404a317))

## [1.14.1](https://github.com/ffflorian/actions/compare/v1.14.0...v1.14.1) (2026-05-24)


### Bug Fixes

* **coolify-deploy:** Use POST for deployment requests ([6d85350](https://github.com/ffflorian/actions/commit/6d85350fe734551e67d3694a16870731ecb28f4b))

# [1.14.0](https://github.com/ffflorian/actions/compare/v1.13.0...v1.14.0) (2026-05-24)


### Features

* Add coolify-deploy action ([#27](https://github.com/ffflorian/actions/issues/27)) ([0da8e0a](https://github.com/ffflorian/actions/commit/0da8e0a029d5bce028ec5f04c94b59b9675e22d4))

# [1.13.0](https://github.com/ffflorian/actions/compare/v1.12.0...v1.13.0) (2026-05-24)


### Features

* remove github-webhook action ([#26](https://github.com/ffflorian/actions/issues/26)) ([2363446](https://github.com/ffflorian/actions/commit/2363446705e627e50aec19bc4f3122c9ff8ae0e3))

# [1.12.0](https://github.com/ffflorian/actions/compare/v1.11.0...v1.12.0) (2026-05-19)


### Features

* **github-webhook:** Add signed GitHub-style headers ([#23](https://github.com/ffflorian/actions/issues/23)) ([cf91890](https://github.com/ffflorian/actions/commit/cf918907669372b95ba01a8cc79af87384a6dcf5))

# [1.11.0](https://github.com/ffflorian/actions/compare/v1.10.2...v1.11.0) (2026-05-19)


### Features

* add github-webhook ([#22](https://github.com/ffflorian/actions/issues/22)) ([c0325dd](https://github.com/ffflorian/actions/commit/c0325dd1feccb0a0d03797e5710fd36b3bcd594d))

## [1.10.2](https://github.com/ffflorian/actions/compare/v1.10.1...v1.10.2) (2026-05-18)


### Bug Fixes

* fail yarn-update when repository checkout is missing ([#21](https://github.com/ffflorian/actions/issues/21)) ([9899dbc](https://github.com/ffflorian/actions/commit/9899dbcbc003a9c542a4e920b773902a74eee32b))

## [1.10.1](https://github.com/ffflorian/actions/compare/v1.10.0...v1.10.1) (2026-05-18)


### Bug Fixes

* **yarn-update:** Use Node 24 ([82f08f8](https://github.com/ffflorian/actions/commit/82f08f8a516c5f07c8053261ac97e01d5c1a43f1))

# [1.10.0](https://github.com/ffflorian/actions/compare/v1.9.0...v1.10.0) (2026-05-07)


### Features

* Use Node.js 26 ([#15](https://github.com/ffflorian/actions/issues/15)) ([a86b7af](https://github.com/ffflorian/actions/commit/a86b7afbd9aa7bbe862b128569c976dc0294f39e))

# [1.9.0](https://github.com/ffflorian/actions/compare/v1.8.0...v1.9.0) (2026-05-07)


### Features

* **force-release:** support multi-semantic-release ([#14](https://github.com/ffflorian/actions/issues/14)) ([a6d155c](https://github.com/ffflorian/actions/commit/a6d155caba0cfef1adec47136c8bd07ba9f30753))

# [1.8.0](https://github.com/ffflorian/actions/compare/v1.7.1...v1.8.0) (2026-05-03)


### Features

* build TypeScript actions and push dist files via semantic-release ([#12](https://github.com/ffflorian/actions/issues/12)) ([db28f3e](https://github.com/ffflorian/actions/commit/db28f3edb1a82a3248555e47d1543a09fbe41fff))

## [1.7.1](https://github.com/ffflorian/actions/compare/v1.7.0...v1.7.1) (2026-05-03)


### Bug Fixes

* **hugo-theme-update:** update peaceiris/actions-hugo to v3.0.0 ([#11](https://github.com/ffflorian/actions/issues/11)) ([4c7af89](https://github.com/ffflorian/actions/commit/4c7af89b7df7898c83450b17725f4e710221a9ab))

# [1.7.0](https://github.com/ffflorian/actions/compare/v1.6.0...v1.7.0) (2026-05-03)


### Features

* **yarn-update:** convert action to real TypeScript action ([#9](https://github.com/ffflorian/actions/issues/9)) ([8151e4f](https://github.com/ffflorian/actions/commit/8151e4fd65d19e2a6afbaa4c22cd36dc5c23a5a4))

# [1.6.0](https://github.com/ffflorian/actions/compare/v1.5.1...v1.6.0) (2026-05-03)


### Features

* **hugo-theme-update:** add Hugo Theme Update action ([#10](https://github.com/ffflorian/actions/issues/10)) ([9633d7e](https://github.com/ffflorian/actions/commit/9633d7ec762a88181525e63ac501973f104c4ed9))

## [1.5.1](https://github.com/ffflorian/actions/compare/v1.5.0...v1.5.1) (2026-05-02)


### Bug Fixes

* **yarn-update:** skip install when installed yarn >= cooldown candidate ([#8](https://github.com/ffflorian/actions/issues/8)) ([8e6f5e5](https://github.com/ffflorian/actions/commit/8e6f5e5afcd5127e1e1605d06dd59945c9547491))

# [1.5.0](https://github.com/ffflorian/actions/compare/v1.4.0...v1.5.0) (2026-05-02)


### Features

* **yarn-update:** add release_cooldown_days input ([#6](https://github.com/ffflorian/actions/issues/6)) ([869c59c](https://github.com/ffflorian/actions/commit/869c59ca88bb3ddf9ee70fc19a203a6d67c635d4))

# [1.4.0](https://github.com/ffflorian/actions/compare/v1.3.3...v1.4.0) (2026-04-19)


### Features

* **yarn-update:** update all yarn installations in repository ([#3](https://github.com/ffflorian/actions/issues/3)) ([0e99318](https://github.com/ffflorian/actions/commit/0e993189a594b9a7abf36ec3cae68717643ef727))

## [1.3.3](https://github.com/ffflorian/actions/compare/v1.3.2...v1.3.3) (2026-04-18)


### Bug Fixes

* **yarn-update:** Allow yarn to update the lockfile ([73c3673](https://github.com/ffflorian/actions/commit/73c3673d5ec470d8b03e3720ae234e3493a39956))

## [1.3.2](https://github.com/ffflorian/actions/compare/v1.3.1...v1.3.2) (2026-04-17)


### Bug Fixes

* **yarn-update:** Run yarn install after update ([a567757](https://github.com/ffflorian/actions/commit/a56775720a199fadf77a76496c383fde4b7889e4))

## [1.3.1](https://github.com/ffflorian/actions/compare/v1.3.0...v1.3.1) (2026-04-02)


### Bug Fixes

* **force-release:** Require git_authorship ([b60fecb](https://github.com/ffflorian/actions/commit/b60fecb130b4bd19003dadeb54948299ae8b3340))

# [1.3.0](https://github.com/ffflorian/actions/compare/v1.2.0...v1.3.0) (2026-04-02)


### Features

* add force-release action ([#1](https://github.com/ffflorian/actions/issues/1)) ([237df11](https://github.com/ffflorian/actions/commit/237df11c7310258b5023bd3ae52f191723375a09))

# [1.2.0](https://github.com/ffflorian/actions/compare/v1.1.1...v1.2.0) (2026-03-31)


### Features

* **github-action-release:** Rename to github-action-release ([6f27c76](https://github.com/ffflorian/actions/commit/6f27c76b9eae9ce383477efeb3d0df43b1e79652))

## [1.1.1](https://github.com/ffflorian/actions/compare/v1.1.0...v1.1.1) (2026-03-31)


### Bug Fixes

* **github-release-action:** Force pushing major tag ([814a46c](https://github.com/ffflorian/actions/commit/814a46c674f7e8cc2d752d5e3979c9c3201f6832))

# [1.1.0](https://github.com/ffflorian/actions/compare/v1.0.0...v1.1.0) (2026-03-31)


### Bug Fixes

* **github-action-release:** Make git author configurable ([a601343](https://github.com/ffflorian/actions/commit/a601343014ca77366c1ff770c94fdcb2f5e82644))
* **github-action-release:** Update author email ([eb59eee](https://github.com/ffflorian/actions/commit/eb59eee110d0cb092d55fb0469ba8a37dd96158c))


### Features

* **git-mirror:** Add git-mirror ([c769378](https://github.com/ffflorian/actions/commit/c769378e1707aaefa78e7fdf36fff9b3358e248d))
* **yarn-update:** Add yarn-update ([f47a786](https://github.com/ffflorian/actions/commit/f47a786c9ce275d5d417b9a404cf2360a760fb68))

# 1.0.0 (2026-03-31)


### Features

* Add GitHub Action Release ([c28966d](https://github.com/ffflorian/actions/commit/c28966df79814de9a81ad6143ac57fe2f4e3a2e0))
* Initial release ([ac3351d](https://github.com/ffflorian/actions/commit/ac3351dcba4fd6d410fe3f0b97b8aec77beb9a17))
