var _ = require('lodash');

exports.inherits = require('util').inherits;

exports.decorateReconnect = function(instance, extraOptions) {

  var options = _.defaults({}, extraOptions || {}, {

    // frequence to start at
    freq_init: 1000,

    // maximum frequence before capping
    freq_max: 1000 * 60,

    // function to find the next frequence
    freq: function(freq_last) {
      return Math.min(freq_last * 2, options.freq_max);
    }

  });

  var freq_last = null;

  return {

    wait: function(then) {
      freq_last = _.isNumber(freq_last) ? options.freq(freq_last) : options.freq_init;
      setTimeout(then, freq_last);
      return freq_last;
    },

    reset: function() {
      freq_last = null;
    }
  
  };

};
