var multiRedis = require('./lib/multi_redis.js');
var redis = multiRedis.createClient({
	host : [ "127.0.0.1", "127.0.0.1"],
	port : [1239, 1240],
	debug : true,
	speedFirst : true
});



//redis.auth("edp", function(err) {
//});
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
                })
              }, 2000);
            })
          })
        })
      })
    })
  })
})
// var redis = require('redis');
// var client = redis.createClient(1239);
// client.on('connect', function(){
//   console.log('connect')
// })
// client.on('error',function(){});
// client.auth('edp');
// client.set("123", 123);
// client.get("123", function(){})