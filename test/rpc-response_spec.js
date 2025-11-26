const helper = require('node-red-node-test-helper');
const rpcServerNode = require('../nodes/rpc-server.js');
const rpcMethodNode = require('../nodes/rpc-method.js');
const rpcResponseNode = require('../nodes/rpc-response.js');

helper.init(require.resolve('node-red'));

describe('rpc-response Node', function() {
    beforeEach(function(done) {
        helper.startServer(done);
    });

    afterEach(function(done) {
        helper.unload();
        helper.stopServer(done);
    });

    it('should route responses back to the originating rpc-method', function(done) {
        const flow = [
            {
                id: 'server',
                type: 'rpc-server',
                name: 'test server',
                endpoint: '/rpc'
            },
            {
                id: 'method',
                type: 'rpc-method',
                server: 'server',
                methodName: 'ping'
            },
            {
                id: 'response',
                type: 'rpc-response',
                wires: []
            }
        ];

        helper.load([rpcServerNode, rpcMethodNode, rpcResponseNode], flow, function() {
            const methodNode = helper.getNode('method');
            const responseNode = helper.getNode('response');

            const requestId = 'rpc_test_1';
            const completion = new Promise((resolve, reject) => {
                methodNode.pendingRequests.set(requestId, { resolve, reject });
            });

            responseNode.receive({
                payload: 'pong',
                rpc: {
                    id: requestId,
                    methodNodeId: methodNode.id
                }
            });

            completion.then((result) => {
                result.should.equal('pong');
                done();
            }).catch(done);
        });
    });
});
