/**
 * Namespace available as require('connex')
 * @namespace Connex
 */
var Connex = exports;

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
Connex.Utils = Connex.utils = require(__dirname + '/utils');

Connex.Contrib = {};

Connex.Contrib.RabbitMQ = require(__dirname + '/../contrib/rabbitmq');

Connex.Contrib.Redis = require(__dirname + '/../contrib/redis');

Connex.Contrib.RedisCo = require(__dirname + '/../contrib/redis-co');

Connex.Contrib.MongoDB = require(__dirname + '/../contrib/mongodb');

Connex.Contrib.RethinkDB = require(__dirname + '/../contrib/rethinkdb');

Connex.Contrib.RethinkDBCo = require(__dirname + '/../contrib/rethinkdb-co');

Connex.Contrib.StatsD = require(__dirname + '/../contrib/statsd');
