var _ = require('lodash');
var connex = require(__dirname + '/../../lib');
var Connection = connex.Connection;

var Redis = module.exports = function(options) {

  if(!(this instanceof Redis)) {
    return new Redis(options);
  }

  Connection.call(this);

  var self = this;

  this.Redis = require('redis');

  this.client = null;
  this._eventHandlers = {};

  this.options = _.defaults(options || {}, {
    host: 'localhost',
    port: 27015
  });

  this._reconnect = connex.utils.decorateReconnect(this, {
    freq_init: 1000,
    freq_max: 1000 * 20
  });

};
require('util').inherits(Redis, Connection);

Redis.prototype.connect = function() {

  var self = this;

  var client = this.Redis.createClient(this.options.port, this.options.host, {
    enable_offline_queue: false,
    max_attempts: 1
  });

  this.domain.add(client);

  var onceError = function(err) {
    client.removeListener('ready', onceReady);
    self.reconnect();
    self.emit('error:connect', err);
    self.emit('error', err);
  };

  var onceReady = function() {
    if(_.isNumber(self.options.db)) {
      client.select(self.options.db);
    }

    self.client = client;
    client.removeListener('error', onceError);
    self.watch();
    self.emit('connect');
    self.setState('connected');
  };

  this._patchStreamListeners(client);

  client.once('ready', onceReady);
  client.once('error', onceError);

};

Redis.prototype.disconnect = function() {

  var self = this;
  var handle = this.client;

  handle.once('close', function() {
    self.emit('disconnect');
    self.setState('disconnected');
    self.cleanup();
  });
  this.unwatch();
  handle.close();

};

Redis.prototype.cleanup = function() {

  var self = this;
  var handle = this.client;

  _.each(this._eventHandlers, function(handler, eventName) {
    handle.removeListener(eventName, handler);
  });

  if(this.client) {
    this.domain.remove(this.client);
    this.client = null;
  }

};

Redis.prototype.reconnect = function() {

  var self = this;
  var handle = this.client;

  this.cleanup();

  var inMs = this._reconnect.wait(function() {
    self.once('connect', self._reconnect.reset);
    self.connect();
  });

  this.setState('reconnecting');
  this.emit('reconnect', inMs);

};

Redis.prototype.getHandle = function() {
  return this.client;
};

Redis.prototype.watch = function() {

  var self = this;
  var handle = this.client;

  this._patchStreamListeners(handle);

  function onceClose() {
    self.unwatch();
    self.reconnect();
  }

  this._eventHandlers.close = onceClose;
  this._eventHandlers.end = onceClose;

  handle.stream.once('close', onceClose);
  handle.stream.once('end', onceClose);

};

Redis.prototype._patchStreamListeners = function(client) {

  client.stream.removeAllListeners('close');
  client.stream.removeAllListeners('end');

};

Redis.prototype.unwatch = function() {

  var handle = this.client;

  if(this._eventHandlers.close) {
    handle.stream.removeListener('close', this._eventHandlers.close);
    delete this._eventHandlers.close;
  }

  if(this._eventHandlers.end) {
    handle.stream.removeListener('end', this._eventHandlers.end);
    delete this._eventHandlers.end;
  }

};

