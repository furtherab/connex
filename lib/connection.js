var _ = require('lodash');
var EventEmitter = require('events').EventEmitter;
var utils = require(__dirname + '/utils');
var domain = require('domain');

/**
 * Constructor for a Connex Connection
 * @augments require('events').EventEmitter
 * @return ConnexConnection
 */
var Base = module.exports = function() {

  if(!(this instanceof Base)) {
    return new Base;
  }

  var self = this;

  this.domain = domain.create();
  this.state = 'disconnected';

  this.domain.on('error', function(err) {
    self.emit('error', err);
  });

};
utils.inherits(Base, EventEmitter);

/**
 * Set state of this connection
 * @param {String} to State to set
 * @return void
 */
Base.prototype.setState = function(to) {
  this.state = to;
  this.emit('state', to);
  this.emit('state:' + to);
};
