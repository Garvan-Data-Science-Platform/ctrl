# Guidance for contributing to `ctrl-next`

## Welcome

Thank you for being interested in contributing to this project!
Please see the information below for guidance on how to get set up with a suitable development environment, and how to collaborate with the project team via GitHub.

## Development Tooling
This project uses [pre-commit](https://pre-commit.com/) to ensure code quality is up to scratch. Please see [installation steps](https://pre-commit.com/#install).

```bash
# You can also install through Homebrew (MacOS)
brew install pre-commit

# Once installed, setup pre-commit in the project by running
pre-commit install
```

## Git + GitHub

Please create issues, and develop work in branches named using the pattern: `feature/issue-##-short-description`.
Submit [pull requests](https://docs.github.com/en/pull-requests) to the `dev` branch (this is the default branch for this repository).
We are using branch protection rules so that all work must be reviewed before it can be merged into the `dev` branch.
Commits in `feature` branches will be squashed when merged into the `dev` branch.
Code review helps improve code quality and performance.
