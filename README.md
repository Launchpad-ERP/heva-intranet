### Heva Intranet

Heva Intranet

### Installation

You can install this app using the [bench](https://github.com/frappe/bench) CLI:

```bash
cd $PATH_TO_YOUR_BENCH
bench get-app $URL_OF_THIS_REPO --branch develop
bench install-app heva_intranet
```

### Contributing

This app uses `pre-commit` for code formatting and linting. Please [install pre-commit](https://pre-commit.com/#installation) and enable it for this repository:

```bash
cd apps/heva_intranet
pre-commit install
```

Pre-commit is configured to use the following tools for checking and formatting your code:

- ruff
- eslint
- prettier
- pyupgrade

### License

mit



-> Excel Export von Stunden und Urlaub
-> Anfahrt Pauschale abziehen von Stunden am Tag (0,30 Cent pro km)
-> Admin Oberfläche für alle einstellungen
-> Vertretung für Urlaub 