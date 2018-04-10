const https = require('https');
const rx = require('rxjs');
const mapParams = require('../mapParams.js');
const Match = require('./match');

/**
 *  PUBG API wrapper
 *
 *  Documentation : https://github.com/Wobow/pubg_api/wiki
 *
 *  Read the README, and the contributing guidelines to contribute to this project.
 *  Append your name/pseudo + github account here
 *
 *  - Alan Balbo <alan.balbo@gmail.com> : https://github.com/Wobow
 *  - Kyle Ruscigno <kyleruscigno@gmail.com> : https://github.com/kyleruscigno
 */


/**
* class for limiting and queueing API requests
*/
class Limiter {
  /**
  * Sets up the Rate Limiter
  * @param {boolean} enabled - whether to use rate limiting
  * @param {int} tokenRate - Your amount of API request tokens per minute
  *
  */

  constructor(enabled, tokenRate) {
    this.items = [];
    this.enabled = enabled;
    this.remaining = tokenRate;
    this.refillRate = (6000 / this.remaining);
    this.release();
  }

  /**
  * Called from requestAPI, updates the remaining request tokens
  */
  update(remaining) {
    this.remaining = remaining;
  }

  /**
  * Defer an API Request until request tokens are available
  * if available or rate limiting is not enabled, return immediately
  */
  defer() {
    if (this.enabled && this.remaining < 1) {
      return new Promise((resolve, reject) => {
        this.items.push(resolve);
      });
    }
    return Promise.resolve();
  }

  /**
  * Remove a Deferred Request from the queue (FIFO)
  * resolve the defer() promises resolve function allowing requestAPI to continue
  * update remaining tokens since pending request will subtract
  */
  finish() {
    if (this.items.length) {
      this.remaining -= 1;
      const resolve = this.items.shift();
      resolve();
    }
  }

  /**
  * Infinite Loop, called every time a rate token generates
  * Finish as many deferred API requests as possible and then reschedule
  */
  release() {
    if (!this.enabled) return;
    for (let i = 0; i < this.remaining; i += 1) {
      this.finish();
    }
    this.remaining += 1;
    setTimeout(this.release(), this.refillRate);
  }
}


class PubgApi {
  /**
  * Sets up the api key to use, and the default shard to request.
  * @param {string} apiKey - The api key used to request the PUBG API.
  * @param {{asyncType: 'promise'|'observable', defaultShard: string}} options -
  * An object with options to pass to the api.
  *   **asyncType** : 'promise' or 'observable'
  *   **defaultShard** :  the default shard, or server to request :
  *  - xbox-as - Asia
  *  - xbox-eu - Europe
  *  - xbox-na - North America
  *  - xbox-oc - Oceania
  *  - pc-krjp - Korea/Japan
  *  - pc-na - North America
  *  - pc-eu - Europe
  *  - pc-oc - Oceania
  *  - pc-kakao
  *  - pc-sea - South East Asia
  *  - pc-sa - South and Central America
  *  - pc-as - Asia
  *
  */
  constructor(apiKey, options = {
    asyncType: 'promise',
    defaultShard: 'pc-na',
    deferRequests: true,
    tokenRate: 10,
  }) {
    this.apiKey = apiKey;
    this.apiURL = 'api.playbattlegrounds.com';
    this.telemetryURL = 'telemetry-cdn.playbattlegrounds.com';
    this.defaultShard = options.defaultShard || 'pc-na';
    this.asyncType = options.asyncType || 'promise';
    this.routesURI = {
      matches: 'matches',
      players: 'players',
    };
    this.limiter = new Limiter(options.deferRequests || true, options.tokenRate || 10);

    if (this.asyncType !== 'promise' && this.asyncType !== 'observable') {
      throw new Error('Unknown async type. Should be promise or observable');
    }
  }

  /**
   * Takes a promises and transforms it to the appropirate async wrapper
   * @param {Promise<any>} promise - The promise to transform
   *
   * @returns {Promise<any>} Depending on the options.asyncType provided.
   */
  wrapAsync(promise) {
    if (this.asyncType === 'observable') {
      return rx.Observable.fromPromise(promise);
    }
    return promise;
  }

  /**
  * Sets the api key for the pubg api
  * @param {string} apiKey The api key to use
  */
  setAPIKey(newApiKey) {
    this.apiKey = newApiKey;
  }

  /**
  * Sets whether or not API Requests should be deferred
  * until their is available request tokens
  * restarts the refill/queue loop if it was previously off
  *
  * @param {boolean} enabled - whether to use rate limiting
  * @param {int} tokenRate - Your amount of API request tokens per minute
  */
  setRateLimiting(enabled, tokenRate) {
    this.limiter.enabled = enabled;
    this.limiter.refillRate = (6000 / tokenRate);
    this.limiter.release();
  }

  /**
  * Sends a request to the pubg api server, and returns a promise with the result.
  *
  * Places an API request on the defer queue (if enabled)
  * If available request tokens it will process immediately
  * otherwise, adds to queue and resolved in order of requests
  *
  * @param {string} shard - The shard to request.
  * @param {string} route - The URI to call. Corresponds to the part of the route after the shard.
  * **Do not append** a slash before of after.
  * @param {[key: string]: string} params - An object with the query params correponding to the route. See the official documentation : https://developer.playbattlegrounds.com/docs/
  *
  * @returns {Promise<any>} A promise with the result, or an error
  */
  requestAPI(shard, route, params) {
    return this.limiter.defer().then(() => {
      return new Promise((resolve, reject) => {
        let queryParams = '';
        if (params) {
          Object.keys(params).forEach((key) => {
            queryParams += queryParams.length ? `&${key}=${params[key]}` : `?${key}=${params[key]}`;
          });
        }
        const headers = {
          Accept: 'application/vnd.api+json',
          Authorization: `Bearer ${this.apiKey}`,
        };
        let rawData = '';
        const req = https.get({
          hostname: this.apiURL,
          path: `/shards/${shard}/${route}${queryParams}`,
          headers,
        }, (res) => {
          res.setEncoding('utf8');
          const resheaders = res.headers;
          this.limiter.update(resheaders['X-RateLimit-Remaining']);
          res.on('data', (data) => {
            rawData += data;
          });
          res.on('end', () => {
            try {
              const parsedData = JSON.parse(rawData);
              if (res.statusCode >= 400) {
                return reject(parsedData);
              }
              return resolve(parsedData);
            } catch (err) {
              return reject(err);
            }
          });
        });
        req.on('error', e => reject(e));
      });
    });
  }

  /**
  * @deprecated
  * Loads matches for the default shard. You can specify filters, page info and sorting type
  *
  * https://developer.playbattlegrounds.com/docs/en/matches.html#/Matches/get_matches
  *
  * @param {object} params - An object with one or many of the following params:
  * - gameMode : 'squad', ...
  * - playerIds : an array of player ids.
  * - createdAtStart : Must occur before end time. Format is iso8601. Default: now() - 14 days
  * - createdAtEnd : The max date of the result matches.
  * - offset : Paging
  * - limit : Number of results max
  * - sort: 'createdAt' or '-createdAt'. Default: createdAt (ascending)
  * @param {string} shard - The shard id. If not specifed, calls the default shard.
  * @returns {Promise<any>} A Promise with the result or an error
  */
  loadMatches(params, shard = this.defaultShard) {
    return this.wrapAsync(this.requestAPI(
      shard,
      this.routesURI.matches,
      mapParams.map(params, mapParams.maps.matches),
    ));
  }

  /**
  * Searches matches for the default shard. You can specify filters, page info and sorting type
  *
  * https://documentation.playbattlegrounds.com/en/players.html#/Players/get_players
  *
  * @param {{playerName: string, playerIds: string}} params - An object with one or
  * many of the following params:
  * - playerNames : in game name (IGN) of a player. Separated by comma.
  * - playerIds : a list of player ids (e.g. account.adadadadaadadadad) separated by comma.
  * @param {string} shard - The shard id. If not specifed, calls the default shard.
  * @returns {Promise<any>} A Promise with the result or an error
  */
  searchPlayers(params, shard = this.defaultShard) {
    return this.wrapAsync(this.requestAPI(
      shard,
      this.routesURI.players,
      mapParams.map(params, mapParams.maps.players),
    ));
  }

  /**
  * Searches matches for the default shard. You can specify filters, page info and sorting type
  *
  * https://documentation.playbattlegrounds.com/en/players.html#/Players/get_players
  *
  * @param {object} params - An object with one or many of the following params:
  * - playerNames : in game name (IGN) of a player. Separated by comma.
  * - playerIds : a list of player ids (e.g. account.adadadadaadadadad) separated by comma.
  * @param {string} shard - The shard id. If not specifed, calls the default shard.
    * @returns {Promise<any>} A Promise with the result or an error
  */
  loadPlayerById(playerId, shard = this.defaultShard) {
    return this.wrapAsync(this.requestAPI(shard, `${this.routesURI.players}/${playerId}`));
  }

  /**
  * Loads a single match within the default shard, given the id.
  *
  * https://developer.playbattlegrounds.com/docs/en/matches.html#/Matches/get_matches__id_
  *
  * @param {string} matchId - The id of the match to load
  *
  * @returns {Promise<Match>} A Promise with the result or an error
  */
  loadMatchById(matchId, shard = this.defaultShard) {
    return this.wrapAsync(this.requestAPI(shard, `${this.routesURI.matches}/${matchId}`).then((res => new Match(res))));
  }


  /**
  * Need to wrap Telemetry Functions for RxJS
  */

  /**
  * Queries an object of match data(s) for the Telemetry URL
  * or multiple if provided with multiple matches
  *
  * https://developer.playbattlegrounds.com/docs/en/telemetry.html#telemetry-events
  *
  * @param {object} parsedData - An object with match data attained through
  * loadMatches, loadMatchByID or otherwise provided
  *
  * @returns {Promise<any>} A Promise with the result or an error
  */
  findTelemetryURLs(parsedData) {
    return this.wrapAsync(async () => {
      const assetData = parsedData.included;
      const returnTelemetryURLs = [];
      for (let i = 0; i < assetData.length; i += 1) {
        const obj = assetData[i];
        if (obj.type === 'asset') {
          returnTelemetryURLs.push(obj.attributes.URL);
        }
      }
      if (!returnTelemetryURLs.length) {
        throw new Error('No Telemetry URLs Found');
      }
      return returnTelemetryURLs;
    });
  }

  /**
  * Loads a single matches Telemetry Data, given the url.
  *
  * https://developer.playbattlegrounds.com/docs/en/telemetry.html#telemetry-events
  *
  * @param {string} url - The Telemetry URL of the match Telemetry to load
  *
  * @returns {Promise<any>} A Promise with the result or an error
  */
  loadTelemetry(url) {
    return this.wrapAsync(new Promise((resolve, reject) => {
      const telemetryPath = url.replace(this.telemetryURL, '');
      const headers = {
        Accept: 'application/vnd.api+json',
      };
      let rawData = '';
      const req = https.get({
        hostname: this.telemetryURL,
        path: telemetryPath,
        headers,
      }, (res) => {
        res.setEncoding('utf8');
        res.on('data', (data) => {
          rawData += data;
        });
        res.on('end', () => {
          try {
            const parsedData = JSON.parse(rawData);
            if (res.statusCode >= 400) {
              return reject(parsedData);
            }
            return resolve(parsedData);
          } catch (err) {
            return reject(err);
          }
        });
      });
      req.on('error', e => reject(e));
    }));
  }

  /**
  * Checks the health status of the api.
  *
  * https://developer.playbattlegrounds.com/docs/en/status.html#/Status/get_status
  *
  * @returns {Promise<any>} A promise with the result
  */
  healthStatus() {
    return this.wrapAsync(new Promise((resolve, reject) => {
      const req = https.get({
        hostname: this.apiURL,
        path: 'status',
        headers: { Accept: 'application/vnd.api+json' },
      }, success => resolve(success));
      req.on('error', e => reject(e));
    }));
  }
}

module.exports = PubgApi;

/**
*=== Example Call Patterns ===
*
* const Pubgapi = require('pubg-api');
* const apiInstance = new Pubgapi('<apiKey>');
*
* apiInstance
*   .loadMatches(options)
*   .then((matches) => {
*     return apiInstance.findTelemetryURLs(matches);
*   })
*   .then((urls) => {
*     return apiInstance.loadTelemetry(urls[0]);
*   })
*   .then((telemetry) => {
*     //do something
*   })
*   .catch((err) => {
*     console.error(err)
*   });
*
*/
