const Roster = require('./roster.js');

/**
 * Describes a Match
 *
 * @property {object} raw - The raw source of the object
 * @property {string} id - The id of the roster within the match
 * @property {{createdAt,duration,gameMode,patchVersion,shardId,stats,tags,titleId}} attributes
 * - The attributes of the roster
 * @property {Assets[]} assets - The telemetry assets of the match
 * @property {Roster[]} rosters - List of rosters within the game
 * @property {*} rounds n/a
 * @property {*} spectators n/a
 * @property {object} included - The list of included resources relevant to the match
*/

class Match {
  /**
   * Constructs a Match instance from a source object
   *
   * @param {*} source - The source object of the match, attained though loadMatchById,
   * or otherwise provided
   */
  constructor(source) {
    this.raw = source;
    this.id = source.data.id;
    this.included = source.included;
    this.attributes = source.data.attributes;
    this.assets = source.data.relationships.assets;
    this.rosters = [];
    this.rounds = [];
    this.spectators = [];

    source.data.relationships.rosters.data.forEach((r) => {
      const roster = new Roster(r, this.included);
      this.rosters.push(roster);
    });
  }

  /**
   * Finds the winning roster of the match and returns it
   *
   * @returns {Roster} The winning roster
  */
  getWinner() {
    return this.rosters.find(r => r.attributes.won === 'true');
  }
/*
  getStatsForPlayerId(playerId) {

  }

  getStatsForRosterId(rosterId) {

  }
  */
}

module.exports = Match;
