<h1 align="center">✅ GitHub Check Runs Action</h1>
<p>
  <a href="https://github.com/dflydev/check-runs-action#readme" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
  <a href="https://github.com/dflydev/check-runs-action/graphs/commit-activity" target="_blank">
    <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" />
  </a>
  <a href="https://github.com/dflydev/check-runs-action/blob/master/LICENSE" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/github/license/dflydev/check-runs-action" />
  </a>
  <a href="https://twitter.com/dflydev" target="_blank">
    <img alt="Twitter: dflydev" src="https://img.shields.io/twitter/follow/dflydev.svg?style=social" />
  </a>
  <a href="https://twitter.com/dflydev" target="_blank">
    <img alt="Twitter: dflydev" src="https://img.shields.io/twitter/follow/dflydev.svg?style=social" />
  </a>
</p>

> Create and manage one or more GitHub [check runs](https://developer.github.com/v3/checks/runs/) per job.

[GitHub Actions](https://github.com/features/actions) already creates a check run for every job. This is great if you can break your workflow into smaller jobs. But if any one job is doing several things for which you'd like feedback as it progresses you are out of luck.

This action allows you to create and manage GitHub check runs throughout the course of a single job.

## 🚀 Quick start

### Just one, please

The following is a quick example showing how `dflydev/check-runs-action` can be used to report a [check run](https://developer.github.com/v3/checks/runs/).

```yml
jobs:
  build:
    name: Build PHP Library
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - name: Set up PHP, with Composer and extensions
        uses: shivammathur/setup-php@v2
        with:
          php-version: 7.4
          coverage: pcov

      - name: PHPUnit
        id: phpunit
        continue-on-error: true
        run: ./vendor/bin/phpunit --coverage-text

      - name: Report PHPUnit Conclusion
        if: always()
        uses: dflydev/check-runs-action@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          id: phpunit
          conclusion: ${{ steps.phpunit.outcome }}
```

### Expect a bunch of things to happen

The following is a quick example showing how `dflydev/check-runs-action` can be used to create multiple check runs in advance with the status `queued`.

```yml
jobs:
  build:
    name: Build Laravel Application
    runs-on: ubuntu-latest
    steps:
      - name: Prepare Check Runs
        uses: dflydev/check-runs-action@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          checks: |
            [
              { "id": "phpunit", "name": "PHPUnit" },
              { "id": "psalm", "name": "Psalm" },
              { "id": "phpcs", "name": "PHP_CodeSniffer" },
              { "id": "eslint", "name": "ESLint" },
              { "id": "assets", "name": "npm run production" },
              { "id": "dusk", "name": "Dusk" }
            ]
          status: "queued"
```

Before running an individual step (like `phpunit`, `psalm`, `phpcs`, `eslint`, `assets` or `dusk`), the status can be updated to `in_progress`.

```yml
jobs:
  build:
    steps:
      - name: Report PHPUnit Starting
        uses: dflydev/check-runs-action@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          id: phpunit
          status: in_progress
```

Execute something that may pass or fail.

In order to actually do something meaningful with fails, you need to pass `true` for `continue-on-error`. It is also important to give these steps an `id` so that following actions (like `check-runs-action`) can capture the outcome.

```yml
jobs:
  build:
    steps:
      - name: PHPUnit
        id: phpunit
        continue-on-error: true
        run: ./vendor/bin/phpunit --coverage-text
```

After individual steps have been completed, they can be marked with their conclusion.

To work with `continue-on-error`, it is recommended to use `steps.<step id>.outcome`.

Set `fail-on-error` to `true` if the job should fail after reporting a failed conclusion.

```yml
jobs:
  build:
    steps:
      - name: Report PHPUnit Conclusion
        if: always()
        uses: dflydev/check-runs-action@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          id: phpunit
          conclusion: ${{ steps.phpunit.outcome }}
          fail-on-error: true
```

Finally, steps that have not been marked with a conclusion can be finalized to a specifed conclusion. This ensures there will be no checks defined upfront stuck in a non-final state when the job ends.

```yml
jobs:
  build:
    steps:
      - name: Clean up checks
        if: always()
        uses: dflydev/check-runs-action@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          conclusion: cancelled
```


## Author

👥 **dflydev**

* Website: [dflydev.com](https://dflydev.com)
* Twitter: [@dflydev](https://twitter.com/dflydev)
* Github: [@dflydev](https://github.com/dflydev)

👤 **Beau Simensen**

* Website: [beausimensen.com](https://beausimensen.com)
* Twitter: [@dflydev](https://twitter.com/beausimensen)
* Github: [@simensen](https://github.com/simensen)


## 💡 Inspiration

This project was heavily inspired by [GitHub Checks](https://github.com/LouisBrunner/checks-action) action. If you only need one check run per job and do not want to specify an arbitrary `id`, check out that action instead!


## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/dflydev/check-runs-action/issues).


## ❤️ Support the development

Give a ⭐️ if this project helped you!

Did this project save you time? Did this project increase your productivity? Did this project solve a problem for you? Did this project make your life easier? Please also consider donating or buying a license!

* [Sponsor dflydev on OpenCollecctive](https://opencollective.com/dflydev)
* [License or sponsor on Gitstore](https://enjoy.gitstore.app/repositories/dflydev/check-runs-action)


## 📝 License

Copyright © 2020 [dflydev](https://github.com/dflydev).<br />
This project is [MIT](https://github.com/dflydev/check-runs-action/blob/master/LICENSE) licensed.
