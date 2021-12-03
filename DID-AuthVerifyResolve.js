const Resolver = require('did-resolver').Resolver;
const getResolver = require('ethr-did-resolver').getResolver;
const EthrDID = require("ethr-did").EthrDID;

module.exports = function(RED) {
    function AuthVerifyResolveNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        node.on('input', async function(msg) {
          const keypair = EthrDID.createKeyPair();
          const ethrDid = new EthrDID(keypair);
          const rpcUrl = "https://mainnet.infura.io/v3/d254009fd63f4c2bb4596685c0b93d73";
          const didResolver = new Resolver(getResolver({ rpcUrl, name: "mainnet" }));
          try {
              msg._jwt = msg.payload;
              msg.payload = await ethrDid.verifyJWT(msg.payload, didResolver);
              msg.signer = msg.payload.signer;
              msg.issuer = msg.payload.issuer;
              if(typeof msg.payload.payload._auth !== 'undefined') {
                let auth = await ethrDid.verifyJWT(msg.payload.payload._auth, didResolver);

                if((typeof auth.payload.sub !== 'undefined') && (auth.payload.sub == msg.payload.issuer)) {
                  if(config.authority == auth.issuer) {
                      let permitted = msg.payload.payload[auth.payload.scope];
                      msg.payload = {};
                      msg.payload[auth.payload.scope] = permitted;
                      node.send(msg);
                      node.status({fill:"green",shape:"dot",text:msg.issuer.substr(9,20)+"..."});
                  } else {
                     throw "Permission Denied "+config.authority+" !== " +auth.issuer;
                  }
                } else {
                     throw "Identity Missmatch "+auth.payload.sub+" !== " +msg.payload.issuer;
                }
              } else {
                // We need to check if we are allowed to pass Unauthorized
              }
            } catch(e) {
              node.status({fill:"red",shape:"dot",text:e.toString()});
              console.log(e);
            }
        });
    }
    RED.nodes.registerType("DID-AuthVerifyResolve",AuthVerifyResolveNode);
}
