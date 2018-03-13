const https = require('https');
const rx = require('rxjs');

/**
 *  PUBG API wrapper
 *
 *  Read the README, and the contributing guidelines to contribute to this project.
 *  Append your name/pseudo + github account here
 *
 *  - Alan Balbo <alan.balbo@gmail.com> : https://github.com/Wobow
 */

class PubgApi {
  /**
  * Sets up the api key to use, and the default shard to request.
  * @param {string} apiKey - The api key used to request the PUBG API.
  * @param {string} options - An object with options to pass to the api.
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
  * @returns The instance of pubgapi, set up correctly.
  */
  constructor(apiKey, options = {
    asyncType: 'promise',
    defaultShard: 'pc-na',
  }) {
    this.apiKey = undefined;
    this.apiURL = 'api.playbattlegrounds.com';
    this.telemetryURL = 'telemetry-cdn.playbattlegrounds.com';
    this.defaultShard = options.defaultShard || 'pc-na';
    this.asyncType = options.asyncType || 'promise';
    this.routesURI = {
      matches: 'matches',
    };

    if (this.asyncType !== 'promise' && this.asyncType !== 'observable') {
      throw new Error('Unknown async type. Should be promise or observable');
    }

    this.wrapAsync = (promise) => {
      if (this.asyncType === 'observable') {
        return rx.Observable.fromPromise(promise);
      }
      return promise;
    };

    /**
    * Sets the api key for the pubg api
    * @param {string} apiKey The api key to use
    */
    this.setAPIKey = (newApiKey) => {
      this.apiKey = newApiKey;
    };

    /**
    * Sends a request to the pubg api server, and returns a promise with the result.
    *
    * @param {string} shard - The shard to request.
    * @param {string} route - The URI to call. Corresponds to the part of the route after the shard.
    * **Do not append** a slash before of after.
    * @param {[key: string]: string} params - An object with the query params correponding to the route. See the official documentation : https://developer.playbattlegrounds.com/docs/
    *
    * @returns A promise with the result, or an error
    */
    this.requestAPI = (shard, route, params) => new Promise((resolve, reject) => {
      let queryParams = '';
      Object.keys(params).forEach((key) => {
        queryParams += queryParams.length ? `&${key}=${params[key]}` : `?${key}=${params[key]}`;
      });
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

    /**
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
    * @returns A Promise with the result or an error
    */
    this.loadMatches = (params = {
      gameMode: undefined,
      playerIds: undefined,
      createdAtStart: undefined,
      createdAtEnd: undefined,
      offset: 0,
      limit: 5,
      sort: 'createdAt',
    }, shard = this.defaultShard) => {
      const computedFilters = {};
      const paramFilters = {
        gameMode: 'filter[gameMode]',
        playerIds: 'filter[playerIds]',
        createdAtEnd: 'filter[createdAt-end]',
        createdAtStart: 'filter[createdAt-start]',
        sort: 'sort',
        offset: 'page[offset]',
        limit: 'page[limit]',
      };
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined) {
          computedFilters[paramFilters[key]] = params[key];
        }
      });
      return this.wrapAsync(this.requestAPI(
        shard,
        this.routesURI.matches,
        Object.keys(computedFilters).length ? computedFilters : undefined,
      ));
    };

    /**
    * Loads a single match within the default shard, given the id.
    *
    * https://developer.playbattlegrounds.com/docs/en/matches.html#/Matches/get_matches__id_
    *
    * @param {string} matchId - The id of the match to load
    *
    * @returns A Promise with the result or an error
    */
    this.loadMatchById = (matchId, shard = this.defaultShard) =>
      this.wrapAsync(this.requestAPI(shard, this.routesURI.matches + matchId));

    /**
    * Checks the health status of the api.
    *
    * https://developer.playbattlegrounds.com/docs/en/status.html#/Status/get_status
    *
    * @returns A promise with the result
    */
    this.healthStatus = () => this.wrapAsync(new Promise((resolve, reject) => {
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
