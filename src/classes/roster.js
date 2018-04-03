
/**
 * Describes a Roster from a match
 * @property {object} raw - The raw source of the object
 * @property {string} id - The id of the roster within the match
 * @property {{shardId: string, won: string, stats: {rank: number, teamId: string}}} attributes
 * - The attributes of the roster
 * @property {object} team - n/a
 * @property {Participant[]} participants - The list of participants of the roster
 *
*/

class Roster {
  /**
   *
   * @param {*} source - An object with roster data attained through
  * a Match, or otherwise provided
   * @param {*} included - The 'included' field of the match, attained through
  * a Match, or otherwise provided
   */
  constructor(source, included) {
    this.raw = source;
    this.id = source.id;
    this.raw = included.find(item => item.type === source.type && item.id === source.id);
    if (!this.raw) {
      throw new Error('Could not find roster in included reosurces');
    }
    this.attributes = this.raw.attributes;
    this.participants = [];
    this.team = this.raw.team;
    this.raw.relationships.participants.data.forEach((p) => {
      const participant = included.find(item => item.type === p.type && item.id === p.id);
      if (participant) {
        this.participants.push(participant);
      }
    });
  }
}

module.exports = Roster;
