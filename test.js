var multiRedis = require('./lib/multi_redis.js');
var redis = multiRedis.createClient({
  server : ['127.0.0.1:1240', '127.0.0.1:1239'],
  //or use these:
  // host : [ "127.0.0.1", "127.0.0.1"],  
  // port : [1239, 1240],
	debug : false,
	speedFirst : true
});

// redis.auth("edp", function(err) {
// });
redis.on("error", function(err){
  console.log("find error: ", err.message);
})

redis.on("end", function(client){
  console.log("client %s:%d disconnect!!!!", client.host, client.port);
})

redis.on("connect", function(client){
  console.log("client %s:%d connected!!!!", client.host, client.port);
})
redis.set("abc", 444, function(err, ok){
	console.log('set ', err, ok);
  redis.get("abc", function(err, data) {
    console.log("get first time: ", err, data);
    redis.get("abc", function(err, data){
      console.log("get second tim: ", err, data);
      redis.del("abc", function(err){
        redis.get("abc", function(err,data){
          console.log("get after del: ", err, data);
          redis.setex("abc", 1, 555, function(){
            redis.get("abc", function(err,data){
              console.log("get after setex: ", err, data);
              setTimeout(function(){
                redis.get("abc", function(err, data){
                  console.log("get after 2s: ", err, data);
                })
              }, 2000);
            })
          })
        })
      })
    })
  })
})
