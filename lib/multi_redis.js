/*!
 * Multi - Redis
 * Copyright(c) 2012 dead_horse <heyiyu.pt@taobao.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */
var redis = require('redis');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
/**
 * Initialize MutiRedis with the given `options`.
 *
 * @param {Object} options
 * @api public
 */
function MultiRedis(options) {
  EventEmitter.call(this);
  options = options || {};
  if (options.server) {
    options.host = [];
    options.port = [];
    if (options.server instanceof String) {
      var stemp = server.split(':');
      options.host.push(stemp[0]);
      options.port.push(stemp[1]);
    } else {
      if (options.server instanceof Array) {
        for (var i=0, len=options.server.length; i!=len; ++i) {
          var stemp = options.server[i].split(':');
          options.host.push(stemp[0]);
          options.port.push(stemp[1]);
        }
      }
    }
  } else {
    options.host = options.host || ['127.0.0.1'];
    options.port = options.port || [6379];
    if (!(options.host instanceof Array)) {
      options.host = [options.host];
      options.port = options.port && [options.port];
      options.socket = options.socket && [options.socket];
    }
  }
  this.debug = options.debug;
  this.clients = [];
  this.index = 0;
  this.speedFirst = options.speedFirst;
  this.pingInterval = options.pingInterval || 10000;
  if(this.speedFirst) {
    this._doPing();
  }


  for (var i=0, len=options.host.length; i!=len; ++i) {
    var client = new redis.createClient(options.port[i] || options.socket[i], options.host[i], options);
    if(options.debug) {
      console.log("%s: Redis connection to %s:%d",Date(), client.host, client.port);
    }   
    this.clients.push(client);
    var self = this;
    (function(client) {
      client.on('end', function() {
        for(var i=0, len=self.clients.length; i!=len; ++i) {
          if(self.clients[i] === client) {
            self.clients.splice(i, 1);
            if(options.debug) {
              console.log("%s: Redis disconnect to %s:%d", Date(), client.host, client.port);
            }

            if(self.clients.length===0) {
              self.emit('error', new Error('All servers are down.'));
            }
            break;
          }
        }
        if(options.speedFirst) {
          self._ping();
        }
        self.emit('end', client);
      })
      client.on('error', function(err) {
        if (options.debug && (err.message&&err.message.indexOf('connect ECONNREFUSED') < 0)) {
          console.log(err.message);
        } else {
          self.emit('error', err);
        }
      })
      client.on("connect", function() {
        for(var i=0, len=self.clients.length; i!=len; ++i) {
          if(self.clients[i]===client) return;
        }
        self.clients.push(client);
        if(options.debug) {
          console.log("%s: Redis connection to %s:%d",Date(), client.host, client.port);
        }
        self.emit('connect', client);
      });
    }) (client);
  }
}

util.inherits(MultiRedis, EventEmitter);
/**
 * redis get like commands
 * @type {Array}
 */
var getCmds = ['get', 'mget', 'exists', 'getbit', 'hget', 'hmget'];
/**
 * redis set like commands
 * @type {Array}
 */
var setCmds = ['set', 'setnx', 'setex', 'append', 'del', 'hset', 'hmset', 'auth', 'select'];

/**
 * change arguments to array
 * @param  {[type]} args [description]
 * @return {[type]}
 */
var toArray = function(args) {
  var arr = [];
  for (var i=0, len=args.length; i<len; ++i) {
    arr[i] = args[i];
  }
  return arr;
}


getCmds.forEach(function(command) {
  MultiRedis.prototype[command] = function(args, callback) {
    var client = this.clients[this._getIndex()];
    client[command].apply(client, toArray(arguments));
    if (this.debug) {
      console.log("Command %s on redis server %s:%d", command, client.host, client.port);
    }
  }
})

setCmds.forEach(function(command) {
  MultiRedis.prototype[command] = function(args, callback) {
    var called = 0;
    var lastArgType = typeof arguments[arguments.length-1];

    if (this.debug) {
      console.log("Command %s on multi redis servers", command);
    }
    var arrArg = toArray(arguments);
    if (lastArgType==='function') {
      var fn = arrArg.pop();
      var self = this;
      var cb = function(err) {
        if(err && err instanceof Error) {
          return fn.apply(null, toArray(arguments));
        }
        if (called === self.clients.length-1) {
          fn.apply(null, toArray(arguments));
        }
        ++called;
      }
      arrArg.push(cb);
    }
    for(var i=0, len=this.clients.length; i!=len; ++i) {
      this.clients[i][command].apply(this.clients[i], arrArg);
    }
  }
})
/**
 * end all the redis server
 * @api public
 */
MultiRedis.prototype.end = function() {
  for (var i=0, len=this.clients.length; i!=len; ++i) {
    this.clients[i].end();
  }  
  this.clients = [];
  if (this.debug) {
    console.log('All redis server end');
  }
}
/**
 * return which server to read
 * @api private
 */
MultiRedis.prototype._getIndex = function() {
  return this.speedFirst ?
         this.index : this.index++ % this.clients.length;
}
/**
 * test speed of each server
 * @return {[type]}
 */
MultiRedis.prototype._doPing = function() {
  var self = this;
  self._pingTimer = setInterval(function(){
    self._ping.call(self);
  }, self.pingInterval);
}

MultiRedis.prototype._ping = function() {
  var self = this;
  var min = 100000000;
  for (var i=0, len=self.clients.length; i!=len; ++i) {
    (function(i) {
      var start = new Date().getTime();
      self.clients[i].ping(function() {
        var interval = new Date().getTime() - start;
        console.log(i, interval);
        if(interval < min) {
          min = interval;
          self.index = i;
        }
      })
    })(i)
  };
  console.log('index', self.index);
}
/**
 * get an instance of multi redis
 * or you can use createClient(options), write port and host in the options
 * @param  {array | string} port    redis server port
 * @param  {array | string} host    redis server host
 * @param  {object} options options
 * @api public
 */
MultiRedis.createClient = function(port, host, options) {
  if(port instanceof Object) {
    options = port;
  } else {
    options.port = port;
    options.host = host;
  }
  return new MultiRedis(options);
}

module.exports = MultiRedis;