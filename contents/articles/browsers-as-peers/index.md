---
title: Browsers as Peers
author: eric
date: 2014-11-20 7:30
template: article.jade
---
Visions of peer-to-peer applications in the browser
<span class="more"></span>

I recently developed an interest in peer-to-peer (or P2P) communication in
the browser. Simply put, the term "P2P" refers to a model where clients also act
as servers and transfer data without the help of a central server.
P2P communication is considered a decentralized model, as opposed to a
centralized model like Facebook Chat, where messages pass through Facebook's
server(s).

In my opinion, the two most notable benefits of P2P are:
- Lower latency and increased reliability due to lack of a central server.
- Data is guaranteed to stay out of the hands of the service provider.

### P2P in the browser

Since P2P results in more rapid, reliable and secure transfer of data, it's a
prime candidate for real-time communication (RTC). RTC in the browser had been
restricted to the use of centralized models [until 2011](http://lists.w3.org/Archives/Public/public-webrtc/2011May/0022.html "WebRTC release"),
when Google released [WebRTC](http://w3c.github.io/webrtc-pc/ "WebRTC WC3 Editors Draft"),
an open source protocol for browsers to implement real-time voice, video and
arbitrary data on the web with built-in encryption to boot.

While reading up on WebRTC, I bumped in to a library called [PeerJS](http://peerjs.com/, "PeerJS website").
PeerJS exposes a [socket.io](http://socket.io/ "SocketIO website")-style
interface for WebRTC, making it easier to author P2P applications. The interface
PeerJS provides is a welcome change from manipulating `RTCPeerConnection`,
`getUserMedia`, etc. yourself.

Here's a code example of a simple PeerJS app:

```javascript
import Peer from 'peerjs';
import {peerKey} from 'config/keys';

// Establish a connection to the PeerServer with our API key
const peer = new Peer({ key: peerKey });

// Create an array of DataConnection objects
const connections = [];

// Notify user with their peer identity
peer.on('open', (id) => console.log(`Your id is ${id}`));

// Handle connections from remote peers
peer.on('connection', handleConnection);

// Set up event handlers for `data` and `close` events
function handleConnection(conn) {
  console.log(`Connected to peer ${conn.id}`);

  // Add the connection to our array of DataConnections
  connections.push(conn);

  // Log arbitrary data received from peers
  conn.on('data', (data) => console.log('Peer data:', data));

  // Remove connection from list of connections on close
  conn.on('close', () => connections.splice(connections.indexOf(conn), 1));
}

// Connect to remote peers through the console
window.connectToPeer = function (id) {
  console.log(`Connecting to peer with id ${id}`);
  // Connect to peer browser via PeerServer
  var conn = peer.connect(id);
  // Handle the connection
  handleConnection(conn);
};

// Send arbitrary data to connected peers
window.sendDataToPeers = function (data) {
  connections.forEach((conn) => conn.send(data));
};
```

<p id="peer-example" class="Box Box--aside">
A version of this script is running on the page right now. In fact, your peer
identity is <code id="peer-id"></code>! Try using the global methods defined
above in the console to connect to a friend and send messages.
</p>

If you're particularly observant, you may notice something in the client code
that contradicts my previous statements. We're using the `Peer` constructor
to establish a connection with a third-party server and receive an identity.
But I just implied that P2P uses no central server to establish a connection
to peers! This is a limitation of the protocol. WebRTC still needs servers,
known as signaling servers, in order to establish connections between clients.

In some cases, a user may be behind a NAT or [Network Address Translation](https://en.wikipedia.org/wiki/Network_address_translation). NAT is a method used to expose an entire network as a single IP address. In this case, we need
an additional server to retrieve the true IP of the client, and another server
to send data between peers as a fallback. A detailed guide to the WebRTC
infrastructure can be found in this excellent [html5rocks overview](http://www.html5rocks.com/en/tutorials/webrtc/infrastructure/ "html5rocks WebRTC infrastructure overview"). PeerJS does not include implementations of
these servers out of the box, but it does provide an easy way to integrate them
into your application.

PeerJS does, however, trivialize the aformentioned signaling problem with
[PeerServer](https://github.com/peers/peerjs-server "PeerServer repository"):
a Node-based, open source implementation of a signaling server. The
package ships with middleware for Express making it simple to integrate into a
pre-existing application. Setting up the server is demonstrated well at the
GitHub repository in the link above, so I won't cover it here. You can also
use the PeerServer cloud API, like I did in the example. This process is covered
in the [PeerJS docs](http://peerjs.com/docs "PeerJS docs").

### Result: sea change in web applications?

As you can see, building applications with WebRTC is a piece of cake, especially
when using a library like PeerJS. But regardless of it's ease of use,
is the protocol going to drastically change the Web? There are plenty of sample
projects around that demonstrate the capabilities of WebRTC, but does the
technology have any place in web applications other than simple P2P games and
Skype clones?

I tend to envision wacky application ideas during my commute. What else would
I be doing in gridlock traffic? I imagined a sort-of live blogging platform,
where users configure "containers" to share data in real time with other peers
in the form of audio, video, streams and messages. Peers could subsequently
share those streams of information to their network of peers by acting as a
proxy. It would be kind of like a real-time, ephemeral Facebook. All in the
browser!

Then I got honked at.

In any case, I think we'll be seeing a lot of WebRTC in the near future.

<script src="https://cdnjs.cloudflare.com/ajax/libs/peerjs/0.3.14/peer.min.js" type="text/javascript"></script>
<script src="main.js" type="text/javascript"></script>
