var multiRedis = require('../');
var redis = require('redis');
var mm = require('mm');
/**
 * be sure you have a redis server
 */
var client;
var options = {
  host : ['127.0.0.1', '127.0.0.1'],
  port : [6379, 6379],
  debug : false
};
describe('functional test', function() {
  describe('#createClient()', function(){
    it('should create redis client ok', function() {
      client = multiRedis.createClient(options);
      client.clients.should.have.length(2);
    });

    it('should create redis client with string host', function() {
      var options = {
        host: '127.0.0.1',
        port: 6379
      };
      multiRedis.createClient(options).clients.should.have.length(1);
    });

    it('should create redis client with string server', function() {
      var options = {
        server: '127.0.0.1:6379'
      };
      multiRedis.createClient(options).clients.should.have.length(1);
    });

    it('should create redis client with host and port', function() {
      multiRedis.createClient(6379, '127.0.0.1').clients.should.have.length(1);
    });   
  });

  describe('#auth()', function () {
    afterEach(mm.restore);
    beforeEach(function () {
      mm.data(client.clients[0], 'auth', 'ok');
      mm.data(client.clients[1], 'auth', 'ok');
    });

    it('should auth ok when both ok', function (done) {
      client.auth('test', done);
    });

    it('should auth ok when clints[0] return err', function (done) {
      mm.error(client.clients[0], 'auth', 'mock error');
      client.auth('test', done);
    });

    it('should auth ok when clints[0] timeout', function (done) {
      mm(client, 'reqTimeout', 100);
      mm.data(client.clients[0], 'auth', 'ok', 200);
      client.auth('test', done);
    });

    it('should auth error when clients all error', function (done) {
      mm.error(client.clients[0], 'auth', 'mock error');
      mm.error(client.clients[1], 'auth', 'mock error');
      client.auth('test', function (err) {
        err.message.should.equal('mock error');
        done();
      });
    });
  });

  describe('#set()', function() {
    it('should set ok', function(done){
      client.set('test', 'mytest', function(err, ok) {
        (!err).should.be.ok;
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
    it('should get by alive client', function(done) {
      var _getIndex = client._getIndex;
      client._getIndex = function() {
        return 100;
      }
      client.get('test', function(err, data) {
        data.should.equal('mytest');
        client._getIndex = _getIndex;
        done();
      });
    });

    it('should get an error', function(done) {
      var _getIndex = client._getIndex;
      client._getIndex = function() {
        return 0;
      }
      var _get = client.clients[0].get;
      client.clients[0].get = function(id, cb) {
        process.nextTick(function() {
          cb(new Error('mock error'));
        });
      }
      var _client = client.clients[0];
      client.get('test', function(err) {
        err.name.should.equal('MRedisError');
        err.message.should.equal('mock error');
        client.alive.should.equal(2);
        client.clients[0].get = _get;
        client._getIndex = _getIndex;
        done();
      });
    });
  })

  describe('#del()', function() {
    it('shoud del ok', function(done) {
      client.del('test', function(err, data){
        client.get('test', function(err, data) {
          (!err).should.be.ok;
          (!data).should.be.ok;
          client.get('test',function(err, data) {
            (!err).should.be.ok;
            (!data).should.be.ok;
            done();
          });
        })
      })
    });

    it('should del error', function(done) {
      var _del = client.clients[1].del;
      client.clients[1].del = function(key, cb) {
        process.nextTick(function() {
          var err = new Error('mock error');
          err.name = 'MockError';
          cb(err);
        });
      }
      client.del('test', function(err, data) {
        err.name.should.equal('MRedisMockError');
        err.message.should.equal('mock error');
        client.clients[1].del = _del;
        done();
      });
    });
  })
  describe('#onEvent', function() {
    it('should emit error', function(done) {
      client.on('redisError', function(client, err) {
        err.message.should.equal('test error');
        done();
      })
      client.clients[0].emit('error', new Error('test error'));
    })
    it('should emit end', function(done) {
      client.on('end', function(client) {
        client.port.should.equal(6379);
        done();
      })
      client.clients[0].stream.emit('end', client.clients[0]);      
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
  });

  describe('#_getAliveClient', function() {
    it('should response 1', function() {
      var _clients = client.clients;
      client.clients = [null, {}];
      client._getAliveClient().should.equal(1);
      client.clients = _clients;
    });

    it('should response -1', function() {
      var _clients = client.clients;
      client.clients = [];
      client._getAliveClient().should.equal(-1);
      client.clients = _clients;
    });
  });


})
