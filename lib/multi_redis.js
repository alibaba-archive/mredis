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
function MultiRedis(options) {
  options = options || {};
  if (!(options.host instanceof Array)) {
    options.host = [options.host];
    options.port = options.port && [options.port];
    options.socket = options.socket && [options.socket];
    new redis.createClient(options.port || options.socket, options.host, options);
  }
  this.clients = [];
  this.num = this.clients.length;
  this.infos = [];
  console.log(options.host.length);
  for (var i=0, len=options.host.length; i!=len; ++i) {
    var client = new redis.createClient(options.port[i] || options.socket[i], options.host[i], options);
    var self = this;
    client.on('connect', function() {
      console.log('connect');
      self.clients.push(client);
      ++this.num;
    });
    client.on('end', function() {
      for(var i=0, len=self.clients.length; i!=len; ++i) {
        if(self.clients[i] === client) {
          console.log('end');
          self.clients.splice(0, 1);
          --this.num;
        }
      }
    })
    client.on('error', function(err) {
      console.log(err);
    })
  }

  // if (options.pass) {
  //   for (var i=0, len=this.num; i!=len; ++i) {
  //     this.clients[i].auth(options.pass, function(err) {
  //       if (err) throw err;
  //     });
  //   }
  // }

  // if(options.db) {
  //   var self = this;
  //   for (var i=0, len=self.num; i!=len; ++i) {
  //     (function(i){
  //       var client = self.clients[i];
  //       client.select(options.db);
  //       client.on("connect", function() {
  //         client.send_anyways = true;
  //         client.select(options.db);
  //         client.send_anyways = false;
  //       })
  //     })(i);
  //   }
  // }
}

MultiRedis.create = function(options) {
  return new MultiRedis(options);
}

module.exports = MultiRedis;