var should = require('should');
var multiRedis = require('../');
var interceptor = require('interceptor');
/**
 * be sure you have a redis server
 */


var client;
var redis;
var options = {
	server : ['127.0.0.1:1241', '127.0.0.1:1242'],
  debug : false,
  speedFirst : true,
  pingInterval : 100,
  reqTimeout: 100
}

var _server1;
var _server2;
describe('multi redis statbility test', function() {
  before(function() {
    _server1 = interceptor.create('127.0.0.1:6379');
    _server2 = interceptor.create('127.0.0.1:6379');
    _server1.listen(1241);
    _server2.listen(1242);
  });

  after(function() {
    _server1.close();
    _server2.close();
  });

  describe('#createClient()', function(){
    it('should create redis client ok', function(done) {
      client = multiRedis.createClient(options);
      client.clients.should.have.length(2);
      done();
    });   
  });

  describe('#block by off network', function() {
    it('should end by off network', function(done) {
      client.once('end', function(c) {
        client.alive.should.equal(1);
        client.del('foo');
        client.set('foo', 'bar');
        client.get('foo', function(err, data) {
          data.should.equal('bar');
          done();
        });
      });
      _server1.block();
    });

    it('should reconnect when network ok', function(done) {
      client.once('connect', function() {
        client.alive.should.equal(2);
        client.del('foo');
        client.set('foo', 'bar');
        client.get('foo', function(err, data) {
          data.should.equal('bar');
          done();
        });
      });
      _server1.open();
    });

    it('should error of All server done', function(done) {
      client.once('mredisError', function(err) {
        client.alive.should.equal(0);
        err.message.should.equal('All servers are down.');
        client.del('foo', function(err) {
          err.message.should.equal('All servers are down.');
          client.set('foo', 'bar', function(err, data) {
            err.message.should.equal('All servers are down.');
            client.get('foo', function(err, data) {
              err.message.should.equal('All servers are down.');
              done();
            });
          });
        });
      });
      _server1.block();
      _server2.block();
    });

    it('should reopen and get ok', function(done) {
      client.once('connect', function() {
        client.del('foo');
        client.set('foo', 'bar');
        client.get('foo', function(err, data) {
          data.should.equal('bar');
          client.once('connect', function() {
            client.del('foo');
            client.set('foo', 'bar');
            client.get('foo', function(err, data) {
              data.should.equal('bar');
              done();
            });
          });
          _server2.open();
        });
      });
      _server1.open();
    });
  });

  describe('#reqTimeout', function() {
    before(function() {
      client.reqTimeout = 0;
      //console.log(client);
    });
    after(function() {
      client.reqTimeout = 100;
    });

    it('should getCmd timeout', function(done) {
      var _getIndex = client._getIndex;
      client._getIndex = function() {
        return 0;
      }
      var _get = client.clients[0].get;
      client.clients[0].get = function(id, cb) {
        setTimeout(function() {
          cb(new Error('mock error'));
        }, 10);
      }
      var _client = client.clients[0];
      client.get('foo', function(err) {
        err.message.should.equal('request timeout.');
        client.alive.should.equal(2);
        client.clients[0].get = _get;
        client._getIndex = _getIndex;
        done();
      });
    });

    it('should setCmd timeout', function(done) {
      var _set = client.clients[0].set;
      client.clients[0].set = function(id, cb) {
        setTimeout(function() {
          cb(null, 'ok');
        }, 10);
      }
      client.set('foo', 'bar', function(err, data) {
        err.message.should.equal('request timeout.');
        client.clients[0].set = _set;
        done();
      });
    });
  });
})
