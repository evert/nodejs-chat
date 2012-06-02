/**
 *
 * Welcome to the chat server :)
 *
 * The chatserver uses socket.io to handle communication, which is pretty
 * awesome to start with.
 *
 * # The following events are supported:
 * 
 * ## nick
 *
 * Requires an object like the following:
 * {
 *   name : 'Your name',
 *   email : 'Your email address'
 * }
 *
 * ## message
 *
 * Requires just a string.  
 *
 * # The server broadcasts the following events:
 * 
 * ## nick
 *
 * This event is emitted whenever a new user connects
 *
 * This event sends an object like:
 * {
 *   id : "A random, unique id",
 *   name : 'Their username',
 *   gravatar : 'A url to the users gravatar'
 * }
 *
 * ## message
 *
 * This event an object such as:
 * {
 *   userId : "The users id",
 *   message : "The actual message"
 * }
 *
 * ## part
 *
 *   userId : "The users id",
 *
 * ## userList
 * 
 * This sends an array containing all the current users in the chat.
 * This array looks something like this:
 *
 * [
 *   {
 *     nickName : 'user1',
 *     id : 'some random id',
 *     gravatar : 'A url to the users gravatar'
 *   },
 *   {
 *     nickName : 'user2',
 *     id : 'some random id'
 *     gravatar : 'A url to the users gravatar'
 *   }
 * ]
 *
 *
 */

var 
    io = require('socket.io').listen(8080),
    crypto = require('crypto'),
    users = [];


function User() {
    this.id = ++User.lastId;
}

User.prototype.id = 0;
User.prototype.email = null;
User.prototype.nickName = null;
User.prototype.serialize = function() {
    return {
        id : this.id,
        nickName : this.nickName,
        gravatar : "http://www.gravatar.com/avatar/" + crypto.createHash('md5').update(this.email).digest('hex')

    }
}
User.lastId = 0;


io.sockets.on('connection', function(socket) {

    var user = new User();
    socket.set('user', user);


    socket.on('nick', function(info) {

        user.email = info.email;
        user.nickName = info.nickName;
        users.push(user);

        socket.broadcast.emit('nick', user.serialize()); 
        socket.emit('userList', users.map(
            function(user) { 
                return user.serialize(); 
            }
        ));

    });

    socket.on('disconnect', function() {
        socket.broadcast.emit('part',{
            nickName : user.nickName,
            userId : user.id
        });
    });
    socket.on('message', function(message) {
        socket.broadcast.emit('message',{
            nickName : user.nickName,
            userId : user.id,
            message: message
        });
    });

});

