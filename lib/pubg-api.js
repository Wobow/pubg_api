'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var https = require('https');

/**
 *  PUBG API wrapper
 *
 *  Read the README, and the contributing guidelines to contribute to this project.
 *  Append your name/pseudo + github account here
 *
 *  - Alan Balbo <alan.balbo@gmail.com> : https://github.com/Wobow
 */

var PubgApi =
/**
* Sets up the api key to use, and the default shard to request.
* @param {string} apiKey - The api key used to request the PUBG API.
* @param {string} defaultShard - The default shard, or server to request :
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
function PubgApi(apiKey) {
  var _this = this;

  var defaultShard = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'pc-na';

  _classCallCheck(this, PubgApi);

  this.apiKey = undefined;
  this.apiURL = 'api.playbattlegrounds.com';
  this.telemetryURL = 'telemetry-cdn.playbattlegrounds.com';
  this.defaultShard = 'pc-na';
  this.routesURI = {
    matches: 'matches'
  };

  /**
  * Sets the api key for the pubg api
  * @param {string} apiKey The api key to use
  */
  this.setAPIKey = function (newApiKey) {
    _this.apiKey = newApiKey;
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
  this.requestAPI = function (shard, route, params) {
    return new Promise(function (resolve, reject) {
      var queryParams = '';
      Object.keys(params).forEach(function (key) {
        queryParams += queryParams.length ? '&' + key + '=' + params[key] : '?' + key + '=' + params[key];
      });
      var headers = {
        Accept: 'application/vnd.api+json',
        Authorization: 'Bearer ' + _this.apiKey
      };
      var rawData = '';
      var req = https.get({
        hostname: _this.apiURL,
        path: '/shards/' + shard + '/' + route + queryParams,
        headers: headers
      }, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (data) {
          rawData += data;
        });
        res.on('end', function () {
          try {
            var parsedData = JSON.parse(rawData);
            if (res.statusCode >= 400) {
              return reject(parsedData);
            }
            return resolve(parsedData);
          } catch (err) {
            return reject(err);
          }
        });
      });
      req.on('error', function (e) {
        return reject(e);
      });
    });
  };

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
  this.loadMatches = function () {
    var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
      gameMode: undefined,
      playerIds: undefined,
      createdAtStart: undefined,
      createdAtEnd: undefined,
      offset: 0,
      limit: 5,
      sort: 'createdAt'
    };

    var computedFilters = {};
    var paramFilters = {
      gameMode: 'filter[gameMode]',
      playerIds: 'filter[playerIds]',
      createdAtEnd: 'filter[createdAt-end]',
      createdAtStart: 'filter[createdAt-start]',
      sort: 'sort',
      offset: 'page[offset]',
      limit: 'page[limit]'
    };
    Object.keys(params).forEach(function (key) {
      if (params[key] !== undefined) {
        computedFilters[paramFilters[key]] = params[key];
      }
    });
    return _this.requestAPI(defaultShard, _this.routesURI.matches, Object.keys(computedFilters).length ? computedFilters : undefined);
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
  this.loadMatchById = function (matchId) {
    return _this.requestAPI(defaultShard, _this.routesURI.matches + matchId);
  };

  /**
  * Checks the health status of the api.
  *
  * https://developer.playbattlegrounds.com/docs/en/status.html#/Status/get_status
  *
  * @returns A promise with the result
  */
  this.healthStatus = function () {
    return new Promise(function (resolve, reject) {
      var req = https.get({
        hostname: _this.apiURL,
        path: 'status',
        headers: { Accept: 'application/vnd.api+json' }
      }, function (success) {
        return resolve(success);
      });
      req.on('error', function (e) {
        return reject(e);
      });
    });
  };
};

module.exports = PubgApi;

//# sourceMappingURL=pubg-api.js.map