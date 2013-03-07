/*!
 * Multi - Redis
 * Copyright(c) 2012 dead_horse <dead_horse@qq.com>
 * MIT Licensed
 */


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
