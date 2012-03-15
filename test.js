var multiRedis = require('./lib/multi_redis.js');

var redis = multiRedis.create({
	host : ["127.0.0.1", "127.0.0.1"],
	port : [1239, 6379]
});