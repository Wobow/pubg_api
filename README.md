# Nodejs Wrapper for the official PUBG API
[![npm 0.0.5](https://img.shields.io/badge/npm-v0.0.5-brightgreen.svg)](https://www.npmjs.com/package/pubg-api)
## Intro
This is a universal wrapper/client for the official [PlayerUnknown's BattleGround's API](https://developer.playbattlegrounds.com/) that runs on Node JS and the browser.

Project owner is [Wobow](https://github.com/Wobow), and is open to contribution.

It includes helpers to do the following :

**Matches**
- Load and filter matches
- Load a specific match


## Table of contents
- [Installation](#installation)
- [Usage](#usage)
- [Status](#status)
- [Contributing](#contributing)
- [Running tests](#tests)
- [Roadmap](#roadmap--guidelines)

## Installation

    $ npm install pubg-api@latest -S

## Usage

After installation, you can import the module to your project using require. 
```javascript
const Pubgapi = require('pubg-api');

const apiInstance = new Pubgapi('<apiKey>');
```
The module exposes a class that represents an instance of the api, given an [official API key](https://developer.playbattlegrounds.com/) that you must provide.

You can then interract with the instance of the API. All routes use promises by defaut. 

For example :
```javascript
apiInstance
    .loadMatches(options)
    .then(matches => {
        // success
    }, err => {
        // handle error
    });
```

You can force the wrapper to return [rxjs' Observables](https://github.com/reactivex/rxjs) only by specifying with the asyncType options:
```javascript
const apiInstance = new PubgApi('<apiKey>', {asyncType: 'observable'});
```
or 
```javascript
apiInstance.asyncType = 'observable';
```
then
```javascript
apiInstance
    .loadMatches(options) // <-- Now returns an Observable
    .subscribe(matches => {
        // success
    }, err => {
        // handle error
    });
```

## Status

This tab highlight the status of each route and function attached to it.

| Route              | Function                     | Status           | Version     |
|-------             |----------                    |--------          |---------    |
| /matches           | `PubgApi.loadMatches`        | Deprecated       | ^0.0.1      |
| /matches/{id}      | `PubgApi.loadMatchById`      | Up to date       | ^0.0.1      |
| /players/          | `PubgApi.searchPlayers`      | Up to date       | ^1.0.0      |
| /players/{id}      | `PubgApi.loadPlayerById`     | Up to date       | ^1.0.0      |
| telemetry          | `PubgApi.loadTelemetry`      | Up to date       | ^0.6.0      |
| /status            | `PubgApi.healthStatus`       | Up to date       | ^0.0.1      |

## Contributing

If you want to contribute, open a pull request. Unless the change you are requesting is a hotfix for the latest stable version, you should always pull from `develop`. 

### Branch organisation
`master` is the branch where we try to have the latest stable version up to date. Every new version shall be tagged properly with its version, followed by a release. One cannot push to this branch without a code review from the code owners. Use develop instead.

`develop` is the branch used to iterate the development versions of the wrapper. It should always be based on `master`. All unstable versions of the wrapper will be tested on this branch. 

### Versioning

We will follow the naming convention of `major`.`minor`.`build`. 

### Lint

We are using `eslint` to check the code syntax, and are using the [AirBnB style guide for Javascript](https://github.com/airbnb/javascript). 
To run the lint :

    $ npm run lint

Be sure to clean your code before submitting it.

### Building

To build the wrapper, run 

    $ npm run build

It will generate the file `lib/pubg-api.js` using babel.

### Publishing

Run

    $ npm publish

It will automatically check lint, unit tests and build the lib properly before publishing. The version must be bumped manually.

## Tests

You can run the unit tests executing npm test. To execute the tests, you must provide an environnment variable `PUBG_API_KEY_TEST` set with the api key you want to use to run the tests. 

    $ export PUBG_API_KEY_TEST=<your API key>
    $ npm test

## Roadmap & Guidelines

The goal of this wrapper is to simplify access to the API, and give a broader spectrum of functions to help developers use the API to its full potential.

This includes developping functions that computes multiple API calls and responses.

- [ ] Implement [Telemetry](https://developer.playbattlegrounds.com/docs/en/telemetry.html) 
- [x] Implement [rxjs observable](https://github.com/reactivex/rxjs) alternative to promise
- [ ] Allow selecting a specific shard for each call, instead of setting a default shard
- [ ] Wrap multiple shard functions
