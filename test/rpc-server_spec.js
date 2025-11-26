const helper = require('node-red-node-test-helper');
const rpcServerNode = require('../nodes/rpc-server.js');

helper.init(require.resolve('node-red'));

describe('rpc-server Node', function() {
    beforeEach(function(done) {
        helper.startServer(done);
    });

    afterEach(function(done) {
        helper.unload();
        helper.stopServer(done);
    });

    it('should be loaded', function(done) {
        const flow = [{ id: 'n1', type: 'rpc-server', name: 'test server' }];
        helper.load(rpcServerNode, flow, function() {
            const n1 = helper.getNode('n1');
            n1.should.have.property('name', 'test server');
            done();
        });
    });

    it('should create RPC endpoint', function(done) {
        const flow = [
            { 
                id: 'n1', 
                type: 'rpc-server', 
                port: 1880,
                endpoint: '/rpc',
                safeEnabled: false,
                corsEnabled: false
            }
        ];
        helper.load(rpcServerNode, flow, function() {
            const n1 = helper.getNode('n1');
            n1.should.have.property('rpc');
            done();
        });
    });
});
