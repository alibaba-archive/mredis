/*!
 * Multi - Redis
 * Copyright(c) 2012 dead_horse <heyiyu.pt@taobao.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var redis = require('redis');

/**
 * Initialize MutiRedis with the given `options`.
 *
 * @param {Object} options
 * @api public
 */
function MultRedis(options) {
  options = options || {};
  if (!(options.client instanceof Array)) {
    this.client = [options.client];
  }
  if (!(options.host instanceof Array)) {
    this.client.push(new redis.createClient(options.port || options.socket, options.host, options));
  }
  this.num = client.length;
  this.
  if (options.pass) {
    for (var i=0, len=this.num; i!=len; ++i) {
      this.client[i].auth(options.pass, function(err) {
        if (err) throw err;
      });
    }
  }

  if(options.db) {
    var self = this;
    for (var i=0, len=self.num; i!=len; ++i) {
      (function(i){
        var client = self.client[i];
        client.select(options.db);
        client.on("connect", function() {
          client.send_anyways = true;
          client.select(options.db);
          client.send_anyways = false;
        })
      })(i);
    }
  }
}

function createDone(times, cb) {

}