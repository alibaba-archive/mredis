var multiRedis = require('./lib/multi_redis.js');
var redis = multiRedis.createClient({
  server : ['127.0.0.1:1240', '127.0.0.1:1239'],
  //or use these:
  // host : [ "127.0.0.1", "127.0.0.1"],  
  // port : [1239, 1240],
	debug : true,
	speedFirst : true
});

// redis.auth("edp", function(err) {
// });

redis.set("abc", 444, function(err, ok){
	console.log(err, ok);
  redis.get("abc", function(err, data) {
    console.log("get first time: %d", data);
    redis.get("abc", function(err, data){
      console.log("get second tim: %d", data);
      redis.del("abc", function(err){
        redis.get("abc", function(err,data){
          console.log("get after del: %d", data);
          redis.setex("abc", 1, 555, function(){
            redis.get("abc", function(err,data){
              console.log("get after setex: %d", data);
              setTimeout(function(){
                redis.get("abc", function(err, data){
                  console.log("get after 2s: %d", data);
                  redis.end();
                })
              }, 2000);
            })
          })
        })
      })
    })
  })
})