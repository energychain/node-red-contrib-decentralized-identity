const EthrDID = require("ethr-did").EthrDID;

module.exports = function(RED) {
    function DIDCreateNode(config) {
        RED.nodes.createNode(this,config);
        const node = this;
        const storage = node.context();
        node.on('input', async function(msg) {
              let keypair = await storage.get("keys");
              if((typeof keypair == 'undefined')||(keypair == null)) {
                keypair = EthrDID.createKeyPair();
                keypair.id = "did:ethr:"+keypair.identifier;
                storage.set("keys",keypair);
              }
              if(typeof msg.payload !== 'object') {
                msg.payload = { '_msg': msg.payload};
              }
              const ethrDid = new EthrDID(keypair);
              msg.payload = await ethrDid.signJWT(msg.payload);
              node.send(msg);
              node.status({fill:"green",shape:"dot",text:keypair.identifier.substr(0  ,20)+"..."});
        });
    }
    RED.nodes.registerType("DID-Create",DIDCreateNode);
}
