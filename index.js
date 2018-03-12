const https = require('https');
const _ = require('lodash');

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
         * @param {string} apiKey - The api key used to request the PUBG API. See https://developer.playbattlegrounds.com/
         * @param {string} defaultShard - The default shard, or server to request. Can be one of the following: 
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
        constructor(apiKey, defaultShard = 'pc-na') {
            this.apiKey = undefined;
            this.apiURL =  'api.playbattlegrounds.com';
            this.telemetryURL =  'telemetry-cdn.playbattlegrounds.com';
            this.defaultShard = 'pc-na';
            this.routesURI = {
                matches: 'matches'
            };

        /**
         * Sets the api key for the pubg api
         * @param {string} apiKey The api key to use
         */
        this.setAPIKey = function(apiKey) {
            this.apiKey = apiKey;
        }

        /**
         * Sends a request to the pubg api server, and returns a promise with the result.
         * 
         * @param {string} shard - The shard to request. Should be the default shard, but can be override though this
         * @param {string} route - The URI to call. Corresponds to the part of the route after the shard. **Do not append** a slash before of after.
         * @param {[key: string]: string} params - An object with the query params correponding to the route. See the official documentation : https://developer.playbattlegrounds.com/docs/
         * 
         * @returns A promise with the result, or an error
         */
        this.requestAPI = function(shard, route, params, noAuth = false) {
            return new Promise((resolve, reject) => {
                let queryParams = '';
                Object.keys(params).forEach(key => {
                    queryParams.length ? queryParams += `&${key}=${params[key]}` : queryParams = `?${key}=${params[key]}`;
                });
                const headers = {'Accept': 'application/vnd.api+json'};
                if (!noAuth) {
                    headers['Authorization'] = `Bearer ${this.apiKey}`;
                }
                let rawData = '';
                const req = https.get({
                    hostname: this.apiURL,
                    path: `/shards/${shard}/${route}${queryParams}`,
                    headers: headers
                }, (res) => {
                    res.setEncoding('utf8');
                    res.on('data', data => {
                        rawData += data;
                    });
                    res.on('end', () => {
                        try {
                            const parsedData = JSON.parse(rawData);
                            if (res.statusCode >= 400) {
                                return reject(parsedData);
                            }
                            resolve(parsedData);
                        } catch (err) {
                            reject(err);
                        }
                    })
                });
                req.on('error', (e) => reject(e));
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
         * - createdAtEnd : The max search time span between createdAt-start and createdAt-end is 14 days. Default: now()
         * - offset : Paging
         * - limit : Number of results max
         * - sort: 'createdAt' or '-createdAt'. Default: createdAt (ascending)
         * @returns A Promise with the result or an error
         */
        this.loadMatches = function(params = {
            gameMode: undefined,
            playerIds: undefined,
            createdAtStart: undefined, 
            createdAtEnd: undefined,
            offset: 0, 
            limit: 5, 
            sort: 'createdAt'
        }) {
            const computedFilters = {};
            params.gameMode ? computedFilters['filter[gameMode]'] = params.gameMode : 0;
            params.playerIds ? computedFilters['filter[playerIds]'] = params.playerIds : 0;
            params.createdAtEnd ? computedFilters['filter[createdAt-end]'] = params.gameMode : 0;
            params.createdAtStart ? computedFilters['filter[createdAt-start]'] = params.gameMode : 0;
            params.sort ? computedFilters['sort'] = params.sort : 0;
            params.offset ? computedFilters['page[offset]'] = params.offset : 0;
            params.limit ? computedFilters['page[limit]'] = params.limit : 0;
            return this.requestAPI(defaultShard, this.routesURI.matches, Object.keys(computedFilters).length ? computedFilters : undefined);
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
        this.loadSingleMatch = function(matchId)  {
            return this.requestAPI(defaultShard, this.routesURI.matches + matchId);
        };

        /**
         * Checks the health status of the api.
         * 
         * https://developer.playbattlegrounds.com/docs/en/status.html#/Status/get_status
         * 
         * @returns A promise with the result
         */
        this.healthStatus = function() {
            return new Promise((resolve, reject) => {
                let req = https.get({
                    hostname: this.apiURL,
                    path: `status`,
                    headers: {'Accept': 'application/vnd.api+json'}
                }, success => {
                    resolve(true);
                });
                req.on('error', e => reject(e));
            })
        };
    }
}

module.exports = PubgApi;