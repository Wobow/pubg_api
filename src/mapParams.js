const mapParams = {
  maps: {
    matches: {
      gameMode: 'filter[gameMode]',
      playerIds: 'filter[playerIds]',
      createdAtEnd: 'filter[createdAt-end]',
      createdAtStart: 'filter[createdAt-start]',
      sort: 'sort',
      offset: 'page[offset]',
      limit: 'page[limit]',
    },
    players: {
      playerIds: 'filter[playerIds]',
      playerNames: 'filter[playerNames]',
    },
  },
  map: (params, map) => {
    if (!params || !map) {
      return undefined;
    }
    const computedFilters = {};
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined) {
        computedFilters[map[key]] = params[key];
      }
    });
    return Object.keys(computedFilters).length ? computedFilters : undefined;
  },
};

module.exports = mapParams;
