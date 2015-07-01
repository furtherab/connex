var _ = require('lodash');
var RethinkDB = require(__dirname + '/../rethinkdb');
var connex = require(__dirname + '/../../lib');

var RethinkDBCo = module.exports = function(options) {

  if(!(this instanceof RethinkDBCo)) {
    return new RethinkDBCo(options);
  }

  return RethinkDB.apply(this, arguments);

};
require('util').inherits(RethinkDBCo, RethinkDB);

RethinkDBCo.prototype.getHandle = function() {
  var handle = this.handle;
  return {

    r: this.RethinkDB,

    conn: handle,

    run: function(query, options) {
      var conn = handle;
      options = options || {};
      return function(done) { return query.run(conn, options, done); };
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
