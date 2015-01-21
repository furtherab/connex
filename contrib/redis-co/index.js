var _ = require('lodash');
var Redis = require(__dirname + '/../redis');
var connex = require(__dirname + '/../../lib');

var RedisCo = module.exports = function(options) {

  if(!(this instanceof RedisCo)) {
    return new RedisCo(options);
  }

  Redis.apply(this, arguments);

  var self = this;

  this.CoRedis = require('co-redis');

  this.on('connect', function() {
    self.co_client = self.CoRedis(self.client);
  });

};
require('util').inherits(RedisCo, Redis);

RedisCo.prototype.getHandle = function() {
  return this.co_client;
};
