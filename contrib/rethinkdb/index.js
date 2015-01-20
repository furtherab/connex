var _ = require('lodash');
var connex = require(__dirname + '/../../lib');
var Connection = connex.Connection;

var RethinkDB = module.exports = function(options) {

  if(!(this instanceof RethinkDB)) {
    return new RethinkDB(options);
  }

  Connection.apply(this, arguments);

  var self = this;

  this.RethinkDB = require('rethinkdb');
  this.handle = null;
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
require('util').inherits(RethinkDB, Connection);

RethinkDB.prototype.connect = function() {

  var self = this;

  this.handle = this.RethinkDB.connect(this.options, function(err, handle) {
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

  this.domain.add(this.handle);

};

RethinkDB.prototype.disconnect = function() {

  var self = this;
  var handle = this.handle;

  handle.once('close', function() {
    self.emit('disconnect');
    self.setState('disconnected');
    self.cleanup();
  });
  this.unwatch();
  handle.close(); 
};

RethinkDB.prototype.cleanup = function() {

  var self = this;
  var handle = this.handle;

  _.each(this._eventHandlers, function(handler, eventName) {
    handle.removeListener(eventName, handler);
  });

  if(this.handle) {
    this.domain.remove(this.handle);
    this.handle = null;
  }

};

RethinkDB.prototype.reconnect = function() {

  var self = this;
  var handle = this.handle;

  this.cleanup();

  var inMs = this._reconnect.wait(function() {
    self.once('connect', self._reconnect.reset);
    self.connect();
  });

  this.setState('reconnecting');
  this.emit('reconnect', inMs);

};

RethinkDB.prototype.watch = function() {

  var self = this;
  var handle = this.handle;

  this._eventHandlers.close = function() {
    self.unwatch();
    self.reconnect();
  };

  handle.once('close', this._eventHandlers.close);

};

RethinkDB.prototype.unwatch = function() {

  var handle = this.handle;

  if(this._eventHandlers.close) {
    handle.removeListener('close', this._eventHandlers.close);
    delete this._eventHandlers.close;
  }

};

RethinkDB.prototype.getHandle = function() {
  var handle = this.handle;

  return {

    r: this.RethinkDB,

    conn: handle,

    run: function(query) {
      var conn = handle;
      return function(done) { return query.run(conn, done); };
    },

    toArray: function(query) {
      var conn = handle;
      return function(done) {
        return query.run(conn, function(err, cursor) {
          if(err) return done(err);
          return cursor.toArray(done);
        });
      };
    }

  };
};
