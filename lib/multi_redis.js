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
  this.total = options.port.length;
  this.alive = 0;
  this.index = 0;
  this.speedFirst = options.speedFirst;
  this.pingInterval = options.pingInterval || 3000;
  //create clients and bind event
  for (var i=0, len=options.host.length; i!=len; ++i) {
    var client = new redis.createClient(options.port[i] || options.socket[i], options.host[i], options);
    if(this.debug) {
      console.log("%s: Redis connection to %s:%d",Date(), client.host, client.port);
    }   
    this.clients.push(client);
    ++this.alive;
    var self = this;
    (function(client) {
      //when connect end
      client.on('end', function() {
        for(var i=0, len=self.total; i!=len; ++i) {
          if(self.clients[i] === client) {
            if(self.debug) {
              console.log("%s: Redis disconnect to %s:%d", Date(), client.host, client.port);
            }
            --self.alive;
            self.clients[i] = null;
            //if last client down
            if(self.alive === 0) {
              self.emit('error', new Error('All servers are down.'));
            }
            //reping
            if(options.speedFirst) {
              self._ping();
            }
            break;
          }
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
        var index = 0;
        for(var i=0, len=self.total; i!=len; ++i) {
          if(client.port === options.port[i] && client.host === options.host[i]) {
            index = i; break;
          }
        }
        if(self.clients[index]) {
          return;
        }
        //if reconnect
        self.clients[index] = client;
        ++self.alive;
        self._ping();
        if(self.debug) {
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
/**
 * get an alive server.
 */
MultiRedis.prototype._getAliveClient = function() {
  for(var i=0, len=this.total; i!=len; ++i) {
    if(this.clients[i]){
      return i;
    }
  }
  return -1;
}

getCmds.forEach(function(command) {
  MultiRedis.prototype[command] = function() {
    var index = this._getIndex();
    var client = this.clients[index];
    var callback = arguments[arguments.length-1];
    if(!client) {
      index = this._getAliveClient();
      if(index < 0) {
        // all server down, an error will thow by event 'end'
        return callback(new Error('All servers are down.'));
      }
      client = this.clients[index];
    }
    var arrArg = toArray(arguments);
    var lastArgType = typeof arrArg[arrArg.length-1];
    if(lastArgType === 'function') {
      var fn = arrArg.pop();
      var self = this;
      var cb = function(err) {
        if (err && typeof err === 'string') {
          if (err.indexOf('connect ECONNREFUSED') < 0) {
            return fn.apply(null, toArray(arguments));
          } else {
            // if the client was down but not delete yet
            // will delete this client
            if(self.debug) {
              console.log("%s: Redis disconnect to %s:%d", Date(), self.clients[index].host, self.clients[index].port);
            }
            --self.alive;
            self.clients[index] = null;
            if(self.speedFirst) {
              self._ping();
            }
            if(self.alive===0) {
              var error = new Error('All servers are down.');
              self.emit('error', error);
              return callback.call(null, error);
            } else {
              arrArg.pop();
              arrArg.push(fn);
              self[command].apply(self, arrArg);
              return ;
            }
          }
        }
        fn.apply(null, toArray(arguments)); 
      }
      arrArg.push(cb);
    }
    client[command].apply(client, arrArg);
    if (this.debug) {
      console.log("Command %s on redis server %s:%d", command, client.host, client.port);
    }
  }
})

setCmds.forEach(function(command) {
  MultiRedis.prototype[command] = function() {
    var called = 0;
    var callback = arguments[arguments.length-1];
    var lastArgType = typeof callback;

    if (this.debug) {
      console.log("Command %s on multi redis servers", command);
    }
    var arrArg = toArray(arguments);
    if (lastArgType==='function') {
      var fn = arrArg.pop();
      var self = this;
      var cbArg;
      //make sure only call cb once
      var haveCalled = false;
      var cb = function(err) {
        ++called;
        if (err && typeof err === 'string') {
          if (err.indexOf('connect ECONNREFUSED') < 0) {
            if(!haveCalled) {
              haveCalled = true;
              return fn.apply(null, toArray(arguments));
            }
            // already callback by ohters
            return;
          } else {
            if(called === self.total) {
              var client = self.clients[called-1];
              if(((self.alive===1 && client) || (self.alive=0)) && !haveCalled) {
                haveCalled = true;
                return fn(new Error('All servers are down'));
              }
              //if sitll have alive server, means already called success before
              if(!haveCalled) {
                haveCalled = true;
                return fn.apply(null, cbArg);
              }
            }
            // if not call cb enough times, just do nothing
          }
        } 
        cbArg = toArray(arguments);
        if (called === self.total && !haveCalled) {
          haveCalled = true;
          fn.apply(null, cbArg);
        }
      }
      arrArg.push(cb);
    }
    var doCmd = false;
    for(var i=0, len=this.total; i!=len; ++i) {
      var client = this.clients[i];
      if(!client) {
        ++called;
        continue;
      }
      doCmd = true;
      client[command].apply(client, arrArg);
    }
    if(!doCmd && typeof callback === 'function') {
      callback(new Error('All servers are down.'));
    }
  }
})
/**
 * end all the redis server
 * @api public
 */
MultiRedis.prototype.end = function() {
  for (var i=0, len=this.total; i!=len; ++i) {
    var client = this.clients[i];
    if(client) {
      client.end();
      client = null;
    }
  }
  this.alive = 0;  
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
  var index = 0;
  var called = 0;
  for (var i=0, len=self.total; i!=len; ++i) {
    (function(i) {
      var start = new Date().getTime();
      var client = self.clients[i];
      if(!client) {
        if(++called === self.total) {
          self.index = index;
        }
        return;
      }
      client.ping(function() {
        var interval = new Date().getTime() - start;
        if(interval < min) {
          min = interval;
          index = i;
        }
        if(++called === self.total) {
          self.index = index;
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
