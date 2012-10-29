## Muilt Redis![travis-ci](https://secure.travis-ci.org/dead-horse/multi_redis.png) 
Manger several redis server.

### Usage 
```javascript
var mredis = require('mredis');
//init
var redis = medis.createClient({
  server : ['127.0.0.1:1240', '127.0.0.1:1239'], //redis server addresses
  debug : false,     //debug info, default false
  speedFirst : true, //choose the fastest server to read. default fase, polling all the servers.
  pingInterval: 3000,//the interval for ping. default 3000ms
  reqTimeout: 3000   //request timeout. default 3000ms
}); 

//then use it just like use redis.
redis.auth("edp", function(err) {});
redis.on("error", function(err){
  console.log("find error: ", err.message);
});
redis.on("end", function(client){
  console.log("client %s:%d disconnect!!!!", client.host, client.port);
});
redis.on("connect", function(client){
  console.log("client %s:%d connected!!!!", client.host, client.port);
});

redis.set('hello', 'world', function(err, ok) {
  redis.get('hello', function(err, data) {
    console.log('data'); // world
  });
});
```  

###Support method   
```javascript
/**
 * redis get like commands
 * @type {Array}
 */
exports.getCmds = [
  'dump', 'exists', 'keys', 'ttl', 'pttl', 'randomkey', 'type',
  'get', 'getbit', 'getrange', 'strlen',
  'hexists', 'hget', 'hgetall', 'hkeys', 'hlen', 'hmget', 'hvals',
  'lindex', 'llen', 'lrange', 
  'scard', 'sdiff', 'sismember', 'smembers', 'srandmember', 'sunion', 
  'zcard', 'zcount', 'zrange', 'zrangebyscore', 'zrank', 'zrevrange', 'zrevrangebyscore', 'zrevrank', 'zscore',
  'mget', 'exists', 'getbit', 'hget', 'hmget', 'info', 'hgetall'
];

/**
 * redis set like commands
 * @type {Array}
 */
exports.setCmds = [
  'del', 'expire', 'expireat', 'move', 'persist', 'pexpire', 'pexpireat', 'rename', 'renamenx', 'sort',
  'append', 'incr', 'decr', 'decrby', 'incrby', 'getset', 'incrbyfloat', 'mset', 'msetnx', 'psetex', 'set', 'setbit', 'setex', 'setnx', 'setrange',
  'hdel', 'hincrby', 'hincrbyfloat', 'hmset', 'hset', 'hsetnx',
  'blpop', 'brpop', 'brpoplpush', 'linsert', 'lpop', 'lpush', 'lpushx', 'lrem', 'lset', 'ltrim', 'rpop', 'rpoplpush', 'rpushx',
  'sadd', 'sdiffstore', 'sinsert', 'smove', 'spop', 'srem', 'sunionstore', 
  'zadd', 'zincrby', 'zintersotre', 'zunionstore',
  'select', 'auth', 'echo', 'ping', 'quit'
];
```

### Install   
`npm install mredis`   
If want to use in `express` or `connect`, use this: `npm install connect-mredis`.

### dependence   
`node-redis`

