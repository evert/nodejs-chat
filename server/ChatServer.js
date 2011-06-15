var 
    http = require("http")
    url = require("url"),
    events = require('events')
    util = require('util'),
    fs = require('fs'),
    crypto = require('crypto');


var currentUsers = [];
var port = 8080;

/* If the EventEmitter does not have a 'once' method (because it's an older
 * version), we're monkeypatching it in
 */
if (events.EventEmitter.prototype.once === undefined) {

    events.EventEmitter.prototype.once = function(event, listener) {

        var self = this;
        this.on(event, function() {

            listener.apply(self, arguments);
            self.removeListener(event,listener);

        });

    };

}

/**
 * The ChatEvents object keeps track of all events happening
 * on the chat. It also assigns a sequence number and allows clients
 * to fetch previous (missed) events.
 *
 * Only events with the name 'broadcast' are retained.
 */
function ChatEvents() {

    events.EventEmitter.call(this);

}

util.inherits(ChatEvents, events.EventEmitter);

ChatEvents.prototype.sequence = 0;
ChatEvents.prototype.previousEvents = [];
ChatEvents.prototype.emit = function(eventName, eventData) {

    if (eventName!=='broadcast') {
        return ChatEvents.super_.prototype.emit.apply(this, arguments);
    }

    this.sequence++;
    eventData.sequence = this.sequence;
    eventData.dateTime = new Date();
    console.log("Event is pushed with sequence: " + this.sequence);
    this.previousEvents.push(eventData);

    ChatEvents.super_.prototype.emit.apply(this,[eventName,eventData]);

}

ChatEvents.prototype.getPreviousEvents = function(since) {

    if (!since) since = 0;
    return this.previousEvents.filter(function(elem) {
        return elem.sequence > since;
    });

}

var chatEvents = new ChatEvents();


/** Helper functions for 'currentUsers' **/
function updateLastSeen(userInfo, longPoll) {

    console.log('updateLastSeen: ' + userInfo.nickName);
    var found = null;
    for(var ii=0; ii < currentUsers.length; ii++) {
        if (currentUsers[ii].nickName === userInfo.nickName) {
            found = currentUsers[ii];
            break;
        }
    }

    if (found) {
        console.log('found');
        found.lastSeen = new Date();
        if (longPoll !== undefined) {
            found.longPoll = longPoll;
        }
    } else {
        console.log('not found');
        userInfo.lastSeen = new Date();
        if (longPoll !== undefined) {
            userInfo.longPoll = longPoll;
        }
        currentUsers.push(userInfo);
        chatEvents.emit('broadcast', {
            type: 'join',
            nickName: userInfo.nickName?userInfo.nickName:'ERROR',
            email: userInfo.email,
            gravatar : "http://www.gravatar.com/avatar/" + crypto.createHash('md5').update(userInfo.email).digest('hex')
        });
    }

};

setInterval(function() {

    console.log('Cleanup sequence. Currently there are ' + currentUsers.length + ' users online.');

    var removeUsers = [];
    for(var ii=0; ii < currentUsers.length; ii++) {

        var user = currentUsers[ii];

        var time = currentUsers[ii].lastSeen.getTime();
        var current = new Date().getTime();

        // Timeout = 60 seconds
        var timeout = 60;
        if (user.longPoll) {
            timeout = 600;
        }

        console.log(user.nickName + ' ' + (time + (timeout * 1000) - current));

        if(time + (timeout * 1000) < current) {
            removeUsers.push(ii);

            chatEvents.emit('broadcast', {
                type: 'part',
                nickName: user.nickName,
                email: user.email
            });

        }

    }

    console.log(removeUsers.length + ' users are cleaned up');
    console.log(removeUsers);
    currentUsers = currentUsers.filter(function(item,key) {
        return (removeUsers.indexOf(key) === -1); 
    });

},6000);


/* Logging */
chatEvents.on('broadcast', function(ev) {

    switch(ev.type) {

        case 'join' :
            console.log('JOIN: ' + ev.nickName);
            break;

        case 'part' :
            console.log('PART: ' + ev.nickName);
            break;

        case 'message' :
            console.log('Message: ' + ev.nickName + ': ' + ev.message);
            break;

    }

});


/**
 * Creates the chat server 
 */
http.createServer(function(request, response) {

    console.log(request.method + ' ' + request.url);

    var urlParts = url.parse(request.url, true);

    // I know.. ugly..
    if (urlParts.pathname.indexOf('/client/') === 0) {
        var subPath = urlParts.pathname.slice(8);
        urlParts.pathname = '/client';
    }

    /* Setting the response CORS headers */
    response.setHeader('Access-Control-Allow-Origin','*'); 
    response.setHeader('Access-Control-Allow-Methods','GET,POST'); 
    response.setHeader('Access-Control-Max-Age','3600'); 
    response.setHeader('Content-Type','application/json'); 

    switch(urlParts.pathname) {

        case '/message' :
            if (!urlParts.query || !urlParts.query.message) {
                response.statusCode = 400;
                response.end(JSON.stringify({ code : 400, info: "You must specify the 'message' GET variable"}));
                return;
            }
            if (!urlParts.query.nickName) {
                response.statusCode = 400;
                response.end(JSON.stringify({ code : 400, info: "You must specify the 'nickName' GET variable"}));
                return;
            }
            if (!urlParts.query.email) {
                response.statusCode = 400;
                response.end(JSON.stringify({ code : 400, info: "You must specify the 'email' GET variable"}));
                return;
            }

            updateLastSeen({
                nickName: urlParts.query.nickName,
                email: urlParts.query.email
            });
            chatEvents.emit('broadcast', {
                type: 'message',
                message: urlParts.query.message,
                nickName: urlParts.query.nickName,
                email: urlParts.query.email,
                gravatar : "http://www.gravatar.com/avatar/" + crypto.createHash('md5').update(urlParts.query.email).digest('hex')
            });

            response.statusCode = 200;
            response.end(JSON.stringify({ code : 200, info: "Thanks for your message!"}));
            break;

        case '/join' :
            if (!urlParts.query || !urlParts.query.nickName) {
                response.statusCode = 400;
                response.end(JSON.stringify({ code : 400, info: "You must specify the 'nickName' GET variable"}));
                return;
            }
            if (!urlParts.query.email) {
                response.statusCode = 400;
                response.end(JSON.stringify({ code : 400, info: "You must specify the 'email' GET variable"}));
                return;
            }

            updateLastSeen({
                nickName: urlParts.query.nickName,
                email: urlParts.query.email
            });
            response.statusCode = 200;
            response.end(JSON.stringify({ code : 200, info: "Thanks for joining!"}));
            break;

        case '/eventpoll' :
            if (!urlParts.query || !urlParts.query.nickName) {
                response.statusCode = 400;
                response.end(JSON.stringify({ code : 400, info: "You must specify the 'nickName' GET variable"}));
                return;
            }
            if (!urlParts.query.email) {
                response.statusCode = 400;
                response.end(JSON.stringify({ code : 400, info: "You must specify the 'email' GET variable"}));
                return;
            }
            var since = 0;
            if (urlParts.query && urlParts.query.since) {
                since = urlParts.query.since;
            }
            var events = chatEvents.getPreviousEvents(since);
            // If there were events, we'll return them right away
            if (events.length > 0) {
                response.statusCode = 200;
                response.end(JSON.stringify(events));

                updateLastSeen({
                    nickName: urlParts.query.nickName,
                    email: urlParts.query.email
                },false);

            } else {
                updateLastSeen({
                    nickName: urlParts.query.nickName,
                    email: urlParts.query.email
                },true);
                var ref = chatEvents.once('broadcast', function(ev) {

                    updateLastSeen({
                        nickName: urlParts.query.nickName,
                        email: urlParts.query.email
                    },false);

                    response.statusCode = 200;
                    response.end(JSON.stringify([ev]));
                });
            }
            break;
        case '/client' :
            fs.readFile('../client/' + subPath, function(error, content) {
                if (error) {
                    response.writeHead(500, {'Content-Type' : 'text/plain' });
                    response.end('Error opening file :S');
                } else {
                    var extension = subPath.slice(subPath.lastIndexOf('.'));
                    var mime = 'text/plain';
                    switch(extension) {
                        case '.html' :
                            mime = 'text/html';
                            break;
                        case '.js' :
                            mime = 'text/javascript';
                            break;
                        case '.css' :
                            mime = 'text/css';
                            break;
                    }

                    response.writeHead(200, {'Content-Type' : mime});
                    response.end(content);
                }

            });
            break;

        default :
            response.writeHead(404, {'Content-Type' : 'text/plain'});
            response.end('404 Not Found!\n\nThis url is not recognized');
            break;

    }

}).listen(port);


console.log('ChatApp Server v0.2 - (c)2011 by Evert Pot');
console.log('Now listening for connections on port ' + port);
