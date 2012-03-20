var multiRedis = require('../lib/multi_redis');

/**
 * be sure you have a redis server
 */


var client;
var redis;
var options = {
	server : ['127.0.0.1:1239', '127.0.0.1:1240'],
  debug : false,
  speedFirst : true,
  pingInterval : 3000
}

describe('multi redis statbility test', function() {
  describe('#createClient()', function(){
    it('should create redis client ok', function(done) {
      client = multiRedis.createClient(options);
      client.clients.should.have.length(2);
      done();
    })   
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
        client.clients.should.have.length(2);
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