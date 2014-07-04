var pull = require("pull-stream");

var idleTimeout = pull.Through(function (read, timeout) {
  var ended, reads=[], cbs=[], output = [];

  return function (end, cb) {
    reads.push({end: end, cb:cb});

    ;(function drain() {
      while (output.length && cbs.length)
        (function (end, data) {
          cbs.shift()(end, data);
        })(output[0][0], output.shift()[1]);

      while (reads.length)
        (function(toRead){
          if (!ended) {
            toRead.timer = setTimeout( function () {
              var err = new Error('TIMEDOUT: ' + timeout + 'ms');
              err.code = 'TIMEDOUT';

              read(err, function (end, data) {
                ended = true;
                output.push([end, data]);
                drain();
              });
            }, timeout);
          }

          read(toRead.end || ended, function (end, data) {
            if (toRead.timer) { clearTimeout(toRead.timer); delete toRead.timer; }

            cbs.push(toRead.cb);
            output.push([end, data]);
            drain();
          })
        })(reads.shift())
    })();
  }
});

module.exports = idleTimeout;