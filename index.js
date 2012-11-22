module.exports = process.env.MREDIS_COV ? require('./lib-cov/multi_redis') : require('./lib/multi_redis');
