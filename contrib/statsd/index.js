var _ = require('lodash');
var connex = require(__dirname + '/../../lib');
var Connection = connex.Connection;

var StatsD = module.exports = function(options) {

  if(!(this instanceof StatsD)) {
    return new StatsD(options);
  }

  Connection.call(this);

  this.StatsD = require('node-statsd');
  this.client = null;
  this._eventHandlers = {};

  this.options = _.defaults(options || {}, {
    host: 'localhost',
    port: 8125
  });

};
require('util').inherits(StatsD, Connection);

StatsD.prototype.connect = function() {
  this.client = new this.StatsD(this.options);

  this.domain.add(this.client);
  this.domain.add(this.client.socket);

  this.emit('connect');
  this.setState('connected');
};

StatsD.prototype.disconnect = function() {
  this.client.close();
  this.emit('disconnect');
  this.setState('disconnected');
};

StatsD.prototype.reconnect = function() {
  this.disconnect();
  this.connect();
};

StatsD.prototype.getHandle = function() {
  return this.client;
};
