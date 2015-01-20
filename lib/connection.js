var _ = require('lodash');
var EventEmitter = require('events').EventEmitter;
var domain = require('domain');

/**
 * Constructor for a Connex Connection
 * @augments require('events').EventEmitter
 * @return ConnexConnection
 */
var Connection = module.exports = function() {

  if(!(this instanceof Connection)) {
    return new Connection;
  }

  var self = this;

  this.domain = domain.create();
  this.state = 'disconnected';

  this.domain.on('error', function(err) {
    self.emit('error', err);
  });

};
require('util').inherits(Connection, EventEmitter);

/**
 * Set state of this connection
 * @param {String} to State to set
 * @return void
 */
Connection.prototype.setState = function(to) {
  this.state = to;
  this.emit('state', to);
  this.emit('state:' + to);
};
