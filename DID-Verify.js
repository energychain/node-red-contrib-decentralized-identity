const Resolver = require('did-resolver').Resolver;
const getResolver = require('ethr-did-resolver').getResolver;
const EthrDID = require("ethr-did").EthrDID;

module.exports = function(RED) {
    function DIDVerifyNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        node.on('input', async function(msg) {
          const keypair = EthrDID.createKeyPair();
          const ethrDid = new EthrDID(keypair);
          const didResolver = new Resolver(getResolver({ rpcUrl:config.rpcUrl, name: "mainnet",chainId: config.chainId,registry:config.registry }));
          try {
              msg._jwt = msg.payload;
              msg.payload = await ethrDid.verifyJWT(msg.payload, didResolver);
              msg.signer = msg.payload.signer;
              msg.issuer = msg.payload.issuer;
              msg.payload = msg.payload.payload;
              node.send(msg);
              node.status({fill:"green",shape:"dot",text:msg.issuer.substr(9,20)+"..."});
            } catch(e) {
              node.status({fill:"red",shape:"dot",text:e.toString()});
            }
        });
    }
    RED.nodes.registerType("DID-Verify",DIDVerifyNode);
}
