## Muilt Redis

![travis-ci](https://secure.travis-ci.org/dead-horse/multi_redis.png) 

[`node_redis`](https://github.com/mranney/node_redis)模块，是现在最成熟的node redis驱动，但是在生产环境中使用它仍然会有几个问题。   

___年久失修，用于生产环境请先验证和现有 redis 的兼容性___

 1. 无法连接一个redis集群。进而在`redis`处产生严重的单点问题。   
 2. 没有超时控制。   

`mredis`是一个在`node_redis`基础上封装的一层对多个redis实例进行管理的模块。通过`mredis`可以连接多个redis服务器，保证只要有任何一个redis服务仍然存活，依赖于mredis的系统就不会挂掉。   

 1. 支持连接多个redis服务，多写单读（写入的时候更新每一台服务器，读取的时候轮询或者从速度最快的服务器读取）。   
 2. 对管理的redis服务连接进行健康检测。将不正常的redis服务断开。   
 3. 所有redis操作(`get`, `set`)都支持超时。    
 4. 保证只要有一个redis服务仍然存活，依赖于mredis的系统就能稳定运行，同时在其他暂时异常的redis服务恢复的时候重新连接。   
 5. mredis的实际使用方法和redis保持完全一致。仅在配置和初始化的时候需要的参数略有不同。   

`mredis`已经过淘宝各种复杂的断网容灾模拟测试，保持稳定运行。   


### Install   
`npm install mredis`   
如果需要在`express`或者`connect`中使用`mredis`作为session存储的容器, 可以使用`connect-mredis`模块: `npm install connect-mredis`.

### Usage  
```javascript
var mredis = require('mredis');
//init
var redis = medis.createClient({
  server : ['127.0.0.1:1240', '127.0.0.1:1239'], //redis server addresses
  debug : false,     //debug info, default false
  speedFirst : true, // 如果为true，则每次读取都会选择从redis集群中响应最快的服务读取，反之，则会对所有集群进行轮询(负载均衡)。
  pingInterval: 3000,//the interval for ping. default 3000ms 对每个redis服务进行心跳检测
  reqTimeout: 3000   //request timeout. default 3000ms       所有的redis请求的超时设置
}); 

//then use it just like use redis.
redis.auth("edp", function(err) {});
redis.on("mredisError", function(err){
  console.log("find error: ", err.message);
});
redis.on("end", function(client){
  console.log("client %s:%d disconnect!!!!", client.host, client.port);
});
redis.on("connect", function(client){
  console.log("client %s:%d connected!!!!", client.host, client.port);
});
redis.on("redisError", function (client, err) {
  console.log("client %s:%d get error: %s", client.host, client.port, err.message);
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
  'blpop', 'brpop', 'brpoplpush', 'linsert', 'lpop', 'lpush', 'lpushx', 'lrem', 'lset', 'ltrim', 'rpop', 'rpoplpush', 'rpushx', 'rpush',
  'sadd', 'sdiffstore', 'sinsert', 'smove', 'spop', 'srem', 'sunionstore', 
  'zadd', 'zincrby', 'zintersotre', 'zunionstore',
  'select', 'echo', 'ping', 'quit'
];
```
### dependence   
`node-redis`

