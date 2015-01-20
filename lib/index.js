
/**
 * Namespace available as require('connex')
 * @namespace Connex
 */
var Connex = module.export;

/**
 * @static
 * @type Manager
 */
Connex.Manager = require(__dirname + '/manager');

/**
 * @static
 * @type Connection
 */
Connex.Connection = require(__dirname + '/connection');

/**
 * @static
 * @type Utils
 */
Connex.Utils = require(__dirname + '/utils');

Connex.Contrib = {};

Connex.Contrib.RabbitMQ = require(__dirname + '/../contrib/rabbitmq');

Connex.Contrib.Redis = require(__dirname + '/../contrib/redis');

Connex.Contrib.MongoDB = require(__dirname + '/../contrib/mongodb');

Connex.Contrib.RethinkDB = require(__dirname + '/../contrib/rethinkdb');
