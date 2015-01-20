var _ = require('lodash');
var connex = require(__dirname + '/../../lib');
var Connection = connex.Connection;

var RabbitMQ = module.exports = function(options) {

  if(!(this instanceof RabbitMQ)) {
    return new RabbitMQ(options);
  }

  Connection.call(this);

  var self = this;

  this.RabbitMQ = require('amqp');
  this.client = null;
  this._eventHandlers = {};

  this.options = _.defaults(options || {}, {
    host: 'localhost',
    port: 27015,
    login: 'test',
    password: 'test',
    vhost: '/'
  });

  this._reconnect = connex.utils.decorateReconnect(this, {
    freq_init: 1000,
    freq_max: 1000 * 20
  });

};
require('util').inherits(RabbitMQ, Connection);

RabbitMQ.prototype.connect = function() {

  var self = this;

  this.client = this.RabbitMQ.createConnection(this.options, {
    reconnect: false
  });

  this.domain.add(this.client);

  var onceError = function(err) {
    self.client.removeListener('ready', onceReady);
    self.reconnect();
    self.emit('error:connect', err);
    self.emit('error', err);
  };

  var onceReady = function() {
    self.client.removeListener('error', onceError);
    self.watch();
    self.emit('connect');
    self.setState('connected');
  };

  this.client.once('ready', onceReady);
  this.client.once('error', onceError);

};

RabbitMQ.prototype.disconnect = function() {

  var self = this;
  var handle = this.client;

  var onFinalError = function(err) {
    if(!err || err.message !== 'read ECONNRESET') {
      self.emit('error', err);
    }
  };

  handle.once('close', function() {
    handle.removeListener('error', onFinalError); // remove even if once
    self.emit('disconnect');
    self.setState('disconnected');
    self.cleanup();
  });

  handle.once('error', onFinalError);

  this.unwatch();
  handle.end();

};

RabbitMQ.prototype.cleanup = function() {

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

RabbitMQ.prototype.reconnect = function() {

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

RabbitMQ.prototype.getHandle = function() {
  return this.client;
};

RabbitMQ.prototype.watch = function() {

  var self = this;
  var handle = this.client;

  this._eventHandlers.close = function() {
    self.unwatch();
    self.reconnect();
  };

  this._eventHandlers.error = function(err) {
    throw err;
  };

  handle.once('close', this._eventHandlers.close);
  handle.on('error', this._eventHandlers.error);

};

RabbitMQ.prototype.unwatch = function() {

  var handle = this.client;

  if(this._eventHandlers.close) {
    handle.removeListener('close', this._eventHandlers.close);
    delete this._eventHandlers.close;
  }

  if(this._eventHandlers.error) {
    handle.removeListener('error', this._eventHandlers.error);
    delete this._eventHandlers.error;
  }

};
