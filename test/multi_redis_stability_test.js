require('./helper/ensure_require');
var multiRedis = require('../lib/multi_redis');
var blackhole = require('netblackhole');
/**
 * be sure you have a redis server
 */


var client;
var redis;
var options = {
	server : ['127.0.0.1:1239', '127.0.0.1:1240', '127.0.0.1:1241'],
  debug : false,
  speedFirst : true,
  pingInterval : 100
}

var _server;
describe('multi redis statbility test', function() {
  before(function() {
    _server = blackhole.create(1241);
  });

  after(function() {
    _server.close();
  });

  describe('#createClient()', function(){
    it('should create redis client ok', function(done) {
      client = multiRedis.createClient(options);
      client.clients.should.have.length(3);
      done();
    });   

    it('should blackhole end by timeout', function(done) {
      client.once('end', function(c) {
        done();
      });      
      setTimeout(function() {
        client.alive.should.equal(2);
      }, 500);
    });
  })

  describe('#one server down', function() {
    it('should ok when working server done', function(done) {
      redis = client.clients[client._getIndex()];
      redis.emit('end');
      setTimeout(function() {
        client.set('test', '123');
        client.get('test', function(err, data) {
          (!err).should.be.ok;
          data.should.equal('123');
          done();
        })
      }, 10);
    })
  })

  describe('#reconnect', function() {
    it('should work fine', function(done) {
      redis.emit('connect');
      setTimeout(function() {
        client.alive.should.equal(2);
        client.set('test1', 'name');
        client.get('test1', function(err, data) {
          (!err).should.be.ok;
          data.should.equal('name');
          done();
        })
      },10);
    })
  })

  describe('#one server down', function() {
    it('should work fine when sleeping server done', function(done) {
      client.clients[client._getIndex()].emit('end');
      setTimeout(function() {
        client.set('test2', 'down');
        client.get('test2', function(err, data) {
          (!err).should.be.ok;
          data.should.equal('down');
          done();
        });
      }, 10);
    })
  })

  describe('#all server down', function() {
    it('should get an error', function(done) {
      client.on('error', function(err){
        err.message.should.equal('All servers are down.');
        done();
      })
      console.log(client.alive);
      client.clients[0]===null ? client.clients[1].emit('end') : client.clients[0].emit('end');
    })
  })

  describe('#all down set&get', function(){
    it('set method should get an error', function(done){
      client.set('down', '123', function(err) {
        err.message.should.equal('All servers are down.');
        client.get('down', function(err, data){
          err.message.should.equal('All servers are down.');
          (!data).should.be.ok;
          done();
        })
      })
    })
  })
})
