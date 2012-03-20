var multiRedis = require('../lib/multi_redis');

/**
 * be sure you have a redis server
 */
var client;
var options = {
  host : ['127.0.0.1', '127.0.0.1'],
  port : [1239, 1240],
  debug : false
}
describe('functional test', function() {
  describe('#createClient()', function(){
    it('should create redis client ok', function(done) {
      client = multiRedis.createClient(options);
      client.clients.should.have.length(2);
      done();
    })   
  })

  describe('#set()', function() {
    it('should set ok', function(done){
      client.set('test', 'mytest', function(err, ok) {
        (!err).should.be.ok;
        console.log(ok);
        ok.should.equal('OK');
        done();
      });
    })
  })

  describe('#get()', function() {
    it('should get ok', function(done) {
      client.get('test', function(err, data) {
        (!err).should.be.ok;
        data.should.equal('mytest');
        done();
      })
    })
    it('should get ok by other server', function(done) {
      client.get('test', function(err, data) {
        (!err).should.be.ok;
        data.should.equal('mytest');
        done();
      })
    })
  })

  describe('#del()', function() {
    it('shoud del ok', function(done) {
      client.del('test', function(err, data){
        client.get('test', function(err, data) {
          (!err).should.be.ok;
          console.log(err, data);
          (!data).should.be.ok;
          client.get('test',function(err, data) {
            (!err).should.be.ok;
            (!data).should.be.ok;
            done();
          })
        })
      })
    })
  })
  describe('#onEvent', function() {
    it('should emit error', function(done) {
      client.on('error', function(err) {
        err.message.should.equal('test error');
        done();
      })
      client.clients[0].emit('error', new Error('test error'));
    })
    it('should emit end', function(done) {
      client.on('end', function(client) {
        client.port.should.equal(1239);
        done();
      })
      client.clients[0].emit('end', client.clients[0]);      
    })
  })
  describe('#end()', function() {
    it('should end all the servers', function(done) {
      var num = options.port.length;
      setTimeout(function() {
        client.alive.should.equal(0);
        done();
      }, 200)
      client.end();
    })
  })

})