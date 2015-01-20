var _ = require('lodash');
var EventEmitter = require('events').EventEmitter;
var connex = require(__dirname + '/../../');
var domain = require('domain');

var MongoDB = module.exports = function(options) {

  if(!(this instanceof MongoDB)) {
    return new MongoDB(options);
  }

  Base.call(this);

  var self = this;

  this.MongoDB = require('mongodb');
  this.db = null;
  this.server = null;
  this._eventHandlers = {};

  this.options = _.defaults(options || {}, {
    host: 'localhost',
    port: 27015,
    db: 'test'
  });

  this._reconnect = connex.utils.decorateReconnect(this, {
    freq_init: 1000,
    freq_max: 1000 * 20
  });

};
connex.utils.inherits(MongoDB, connex.Connection);

MongoDB.prototype.connect = function() {

  var self = this;

  this.server = new this.MongoDB.Server(this.options.host, this.options.port);
  this.db = new this.MongoDB.Db(this.options.db, this.server, {
    w: 1,
    journal: true,
    fsync: false
  });

  this.domain.add(this.server);
  this.domain.add(this.db);

  this.db.open(function(err) {
    if(err) {
      self.reconnect();
      self.emit('error', err);
      self.emit('error:connect', err);
    } else {
      self.watch();
      self.emit('connect');
      self.setState('connected');
    }
  });

};

MongoDB.prototype.disconnect = function() {

  var self = this;
  var handle = this.getHandle();

  handle.once('close', function() {
    self.emit('disconnect');
    self.setState('disconnected');
    self.cleanup();
  });
  this.unwatch();
  handle.close();

};

MongoDB.prototype.cleanup = function() {

  var self = this;
  var handle = this.getHandle();

  _.each(this._eventHandlers, function(handler, eventName) {
    handle.removeListener(eventName, handler);
  });

  if(this.db) {
    this.domain.remove(this.db);
    this.db = null;
  }

  if(this.server) {
    this.domain.remove(this.server);
    this.server = null;
  }

};

MongoDB.prototype.reconnect = function() {

  var self = this;
  var handle = this.getHandle();

  this.cleanup();

  var inMs = this._reconnect.wait(function() {
    self.once('connect', self._reconnect.reset);
    self.connect();
  });

  this.setState('reconnecting');
  this.emit('reconnect', inMs);

};

MongoDB.prototype.watch = function() {

  var self = this;
  var handle = this.getHandle();

  this._eventHandlers.close = function() {
    self.unwatch();
    self.reconnect();
  };

  handle.once('close', this._eventHandlers.close);

};

MongoDB.prototype.unwatch = function() {

  var handle = this.getHandle();

  if(this._eventHandlers.close) {
    handle.removeListener('close', this._eventHandlers.close);
    delete this._eventHandlers.close;
  }

};

MongoDB.prototype.getHandle = function() {
  return this.db;
};
