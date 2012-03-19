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
  this.pingInterval = options.pingInterval || 3000;
  //create clients and bind event
  for (var i=0, len=options.host.length; i!=len; ++i) {
    var client = new redis.createClient(options.port[i] || options.socket[i], options.host[i], options);
    if(options.debug) {
      console.log("%s: Redis connection to %s:%d",Date(), client.host, client.port);
    }   
    this.clients.push(client);
    var self = this;
    (function(client) {
      //when connect end
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
        //reping
        if(options.speedFirst) {
          self._ping();
        }
        self.emit('end', client);
      });
      //when error
      client.on('error', function(err) {
        if (err.message&&err.message.indexOf('connect ECONNREFUSED') < 0) {
          self.emit('error', err);
        }
      });
      //when connect
      client.on("connect", function() {
        for(var i=0, len=self.clients.length; i!=len; ++i) {
          if(self.clients[i]===client) return;
        }
        //if reconnect
        self.clients.push(client);
        self._ping();
        if(options.debug) {
          console.log("%s: Redis connection to %s:%d",Date(), client.host, client.port);
        }
        self.emit('connect', client);
      });
    }) (client);
  }
  //ping each server to test the delay
  if(this.speedFirst) {
    this._doPing();
  }
}

util.inherits(MultiRedis, EventEmitter);
/**
 * redis get like commands
 * @type {Array}
 */
var getCmds = ['get', 'mget', 'exists', 'getbit', 'hget', 'hmget', 'info'];
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
    var index = this._getIndex();
    var client = this.clients[index];
    if(!client) {
      if(index < this.clients.length) {
        this.clients.splice(index, 1);
      }
      if(this.clients.length !== 0) {
        client = this.clients[0];
      } else {
        // all server down, an error will thow by event 'end'
        return callback(new Error('All servers are down.'));
      }
    }
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
        if (err && err instanceof Error) {
          if (err.message.indexOf('connect ECONNREFUSED') < 0) {
            return fn.apply(null, toArray(arguments));
          } else {
            //if one client are down but not delete yet, just jump it, it will be delete later
            ++called; 
          }
        }
        if (called >= self.clients.length-1) {
          fn.apply(null, toArray(arguments));
        }
        ++called;
      }
      arrArg.push(cb);
    }
    for(var i=0, len=this.clients.length; i!=len; ++i) {
      var client = this.clients[i];
      if(!client) {
        this.clients.splice(i, 1);
        --len;
        ++called;
        continue;
      }
      client[command].apply(client, arrArg);
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
  self._ping();
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
      var client = self.clients[i];
      if(!client) {
        this.clients.splice(i, 1);
        --len;
        return;
      }
      self.clients[i].ping(function() {
        var interval = new Date().getTime() - start;
        if(interval < min) {
          min = interval;
          self.index = i;
        }
      })
    })(i)
  };
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
  if(!(port instanceof String || port instanceof Array)) {
    options = port;
  } else {
    options.port = port;
    options.host = host;
  }
  return new MultiRedis(options);
}

module.exports = MultiRedis;
