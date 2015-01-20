var _ = require('lodash');
var connex = require(__dirname);
var EventEmitter = require('events').EventEmitter;
var utils = require(__dirname + '/utils');

/**
 * Constructor for a Connex Manager
 * @class ConnexManager
 * @augments require('events').EventEmitter 
 * @param {Object} [connections] Connections to add
 * @param {Object} [options] Options for adding
 * @return ConnexManager
 */
var Manager = module.exports = function(connections, options) {

  if(!(this instanceof Manager)) {
    return new Manager(connections, options);
  }

  var self = this;

  connections = connections || {};

  _.bindAll(this, 'add', 'remove', 'get', 'getHandle');

  this._instances = {};
  this._handlers = {};

  _.each(connections, function(instance, name) {
    self.add(name, instance, options);
  });

};
utils.inherits(Manager, EventEmitter);

/**
 * Add a connection to manage
 * @param {String} name Name of connection
 * @param {ConnexConnection} instance Instance of connection
 * @param {Object} [options] Options for adding
 * @return {void}
 */
Manager.prototype.add = function(name, instance, options) {
  options = options || {};

  var self = this;

  if(name in this._instances) {
    throw new Error('Instance with name "' + name + '" already exists');
  }

  this._instances[name] = instance;
  this._handlers[name] = {};

  this._addInstanceEvent(instance, name, 'connect', function() {
    self.emit(self._getProxyEventName('connect', name));
    self.emit('connect', name);
  });

  this._addInstanceEvent(instance, name, 'disconnect', function() {
    self.emit(self._getProxyEventName('disconnect', name));
    self.emit('disconnect', name);
  });

  this._addInstanceEvent(instance, name, 'error', function(err) {
    self.emit(self._getProxyEventName('error', name), err);
    self.emit('error', err);
  });

  this._addInstanceEvent(instance, name, 'reconnect', function(ms) {
    self.emit(self._getProxyEventName('reconnect', name), ms);
    self.emit('reconnect', name, ms);
  });

  this._addInstanceEvent(instance, name, 'state', function(to) {
    self.emit(self._getProxyEventName('state', name), to);
    self.emit(self._getProxyEventName('state', name, to));
    self.emit('state', name, to);
  });

  var defineOptions = {
    enumerable: true,
    configurable: true,
    get: function() {
      return self.getHandle(name);
    }
  };

  // define some magic getters
  Object.defineProperty(this, name, defineOptions);
  Object.defineProperty(this, name.toLowerCase(), defineOptions);

  if(!options.delayConnect) {
    instance.connect();
  }

};

/**
 * Disconnect from a connection and remove it from the manager
 * @param {String} name Name of connection to remove
 * @return void
 */
Manager.prototype.remove = function(name) {

  var self = this;
  var instance = this.get(name);

  _.each(this._handlers[name], function(handler, eventName) {
    instance.removeListener(eventName, handler);
  });

  delete this._handlers[name];
  delete this._instances[name];

  // delete magic getters
  delete this[name];
  delete this[name.toLowerCase()];

  instance.disconnect();

  return instance;

};

/**
 * Get a managed connection object
 * @param {String} name Name of connection to get
 * @return {ConnexConnection}
 */
Manager.prototype.get = function(name) {

  if(!(name in this._instances)) {
    throw new Error('Instance with name "' + name + '" does not exist');
  }

  return this._instances[name];
};

/**
 * Determine if a connection exists
 * @param {String} name Name of connection to check
 * @return {Boolean}
 */
Manager.prototype.has = function(name) {
  return name in this._instances;
};

/**
 * Get a managed connection handle
 * @param {String} name Name of connection to get handle for
 * @return {Object}
 */
Manager.prototype.getHandle = function(name) {
  var instance = this.get(name);
  return instance.getHandle();
};

/**
 * Returns a object with magic lowercase-getHandlers for all added connections
 * @return {Object}
 */
Manager.prototype.getMagicHandleObject = function() {
  return Object.defineProperties({}, _.reduce(this._handles, function(obj, instance, name) {

    obj[name] = obj[name.toLowerCase()] = {
      configurable: true,
      enumerable: true,
      get: function() { return instance.getHandle(); }
    };

    return obj;
  
  }, {}));
};

Manager.prototype._addInstanceEvent = function(instance, instanceName, eventName, handler) {

  if(eventName in this._handlers[instanceName]) {
    instance.removeListener(eventName, this._handlers[instanceName][eventName]);
    delete this._handlers[instanceName][eventName];
  }

  instance.on(eventName, handler);
  this._handlers[instanceName][eventName] = handler;

  return handler;
};

Manager.prototype._getProxyEventName = function() {
  return _.toArray(arguments).join(':');
};

