// Establish a connection to the PeerServer
const rtcSupport = ['RTCPeerConnection', 'webkitRTCPeerConnection', 'mozRTCPeerConnection']
  .some(
    (x) => x in window
  );

if (!rtcSupport) {
  document.getElementById('peer-example').style.display = 'none';
} else {
  const peer = new Peer({ key: 'xjx48wl2wq4a38fr' });
  const connections = [];

  const $id = document.getElementById('peer-id');

  // Notify user with their peer identity
  peer.on('open', (id) => {
    console.log(`Your id is ${id}`);
    $id.textContent = id;
  });

  // Handle connections from remote peers
  peer.on('connection', handleConnection);

  // Set up event handlers for `data` and `close` events
  function handleConnection(dataConnection) {
    console.log(`Connected to peer ${dataConnection.id}`);

    connections.push(dataConnection);

    // Log data received from peers
    dataConnection.on('data', (data) => console.log('Peer data:', data));

    // Remove connection from list of connections on close
    dataConnection.on('close', () => {
      connections.splice(connections.indexOf(dataConnection), 1);
    });
  }

  // Connect to remote peers through the console
  window.connectToPeer = function (id) {
    console.log(`Connecting to peer with id ${id}`);
    var dataConnection = peer.connect(id);
    handleConnection(dataConnection);
  };

  // Send data to connected peers
  window.sendDataToPeers = function (data) {
    connections.forEach(
      (dataConnection) => dataConnection.send(data)
    );
  };
}
