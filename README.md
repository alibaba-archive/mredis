## Muilt Redis  
Manger several redis server.

### Usage 
```js  
var mredis = require('mredis');
//init
var redis = medis.createClient({
  server : ['127.0.0.1:1240', '127.0.0.1:1239'], //redis server addresses
  debug : false,     //debug info, default false
  speedFirst : true  //choose the fastest server to read. default fase, polling all the servers.
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
```js
getCmds = ['get', 'mget', 'exists', 'getbit', 'hget', 'hmget', 'info', 'hgetall'];

setCmds = ['set', 'setnx', 'setex', 'append', 'del', 'hset', 'hmset', 'auth', 'select', 'incr', 'decr', 'hincrby', 'expire'];
```

### Install   
`npm install mredis`   
If want to use in `express` or `connect`, use this: `npm install connect-mredis`.

### dependence   
`node-redis`

