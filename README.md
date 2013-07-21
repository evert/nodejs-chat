Chat server for Node.js
=======================

Requirements: [nodejs][1]

This project was created as sample server code for a javascript /
[backbone.js][2] workshop. It has not been tested in real-life scenarios,
because it's purpose has been strictly educational.

The workshop's goal was to teach a better style of frontend development with
javascript.

The source contains two directories:

1. server
2. client

The server is complete and can be run as-is. The client directory has many
parts missing, with the intention that attendees of the workshop would
implement them.

However, the [GitHub repository][3] also contains a `complete` branch, which
contains a client for this server that has been fully implemented. If you
arrived at the github page, hoping to find a full example for a javascript
server and client, the `complete` branch is where you need to be.

Starting the server
-------------------

1. cd server
2. Run `node ChatServer.js`
3. This will start the server on http://localhost:8080/

After this, open the client code (index.html) in a browser. The url to the
server can be configured in the `client/js/chatapp.js` file.

Copyright
---------

(c)2011-2013 Evert Pot

Thanks to Boy Baukema

[1]: http://nodejs.org/
[2]: http://backbonejs.org/
[3]: https://github.com/evert/nodejs-chat/
