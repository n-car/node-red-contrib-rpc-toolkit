const helper = require('node-red-node-test-helper');
const rpcClientNode = require('../nodes/rpc-client.js');

helper.init(require.resolve('node-red'));

describe('rpc-client Node', function() {
    beforeEach(function(done) {
        helper.startServer(done);
    });

    afterEach(function(done) {
        helper.unload();
        helper.stopServer(done);
    });

    it('should be loaded', function(done) {
        const flow = [
            { 
                id: 'n1', 
                type: 'rpc-client', 
                name: 'test client',
                serverUrl: 'http://localhost:3000/rpc',
                method: 'testMethod',
                timeout: 5000
            }
        ];
        helper.load(rpcClientNode, flow, function() {
            const n1 = helper.getNode('n1');
            n1.should.have.property('name', 'test client');
            done();
        });
    });

    it('should create RPC client', function(done) {
        const flow = [
            { 
                id: 'n1', 
                type: 'rpc-client',
                serverUrl: 'http://localhost:3000/rpc',
                method: 'testMethod',
                timeout: 5000,
                safeEnabled: false
            }
        ];
        helper.load(rpcClientNode, flow, function() {
            const n1 = helper.getNode('n1');
            n1.should.have.property('client');
            done();
        });
    });
});
