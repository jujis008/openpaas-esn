'use strict';

var messageLike = require('../message/like');
var logger = require('../logger');

module.exports.init = function() {
  logger.debug('Initializing the resource-link pubsub channel');
  messageLike.listen();
};
