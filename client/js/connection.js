/**
 * This class is responsible for connecting to the server.
 *
 * To instantiate it, you must pass a:
 *   ChatApp.Model.UserList and
 *   ChatApp.Model.MessageList
 *
 * The connection class directly interacts with these collections.
 * To make the initial connection, just call the 'connect' function
 * and pass a nickName and email address.
 */
ChatApp.Connection = function(userList, messageList) {

    this.userList = userList;
    this.messageList = messageList;

}
_.extend(window.ChatApp.Connection.prototype, Backbone.Events, {

    socket : null,
    userList : null,

    /**
     * Connect to the server
     */
    connect : function(nickName, email) {

        this.socket = io.connect(
            ChatApp.serverUrl
        );
        this.nick(nickName, email);

        var self = this;

        this.socket.on('error', function(arg) { self.onError(arg) });
        this.socket.on('userList', function(arg) { self.onUserList(arg) });
        this.socket.on('part', function(arg) { self.onPart(arg) });
        this.socket.on('join', function(arg) { self.onJoin(arg) });
        this.socket.on('message', function(arg) { self.onMessage(arg) });

    },

    /**
     * Sets the current user's nick and email address.
     */
    nick : function(nickName, email) {

        this.socket.emit('nick', {
            nickName : nickName,
            email    : email
        });

    },

    /**
     * Sends a message to the server
     */
    message : function(message) {

        this.socket.emit('sendMessage', message);

    },

    /**
     * This method handles errors coming from the server.
     */
    onError : function(errorInfo) {

        if (console.log) {
            console.log('Server error: ' + errorInfo.message);
        } else {
            window.alert(errorInfo.message);
        }

    },

    /**
     * This event is triggered when a full userlist is sent by the server. This
     * is basically a 'reset' of the user list.
     */
    onUserList : function(users) {

        var self = this;

        _.each(users, function(user) {
            self.userList.add(user);
        });

    },

    /**
     * This event is triggered whenever a user leaves the room.
     */
    onPart : function(user) {

        // Finding the user with this id.
        var userModel = this.userList.find(
            function(checkUser) {
                return checkUser.get('id') == user.id;
            }
        );
        this.userList.remove(userModel);

    },

    /**
     * This event is triggered whenever a new user enters the room.
     */
    onJoin : function(user) {

        this.userList.add(user);

    },

    /**
     * This event is triggered whenever a new message arrived from the server.
     */
    onMessage : function(message) {

        message.time = this.parseISO8601(message.time);
        this.messageList.add(message);

    },

    /**
     * Parse a UTC date in ISO 8601 format to a Date object.
     *
     * Because ISO 8601 is not officially supported (and doesnt work in latest Safari).
     *
     * @url http://anentropic.wordpress.com/2009/06/25/javascript-iso8601-parser-and-pretty-dates/
     */
    parseISO8601 : function(input) {

        var parts = input.split('T'),
            dateParts = parts[0].split('-'),
            timeParts = parts[1].split('Z'),
            timeSubParts = timeParts[0].split(':'),
            timeSecParts = timeSubParts[2].split('.'),
            timeHours = Number(timeSubParts[0]),
            _date = new Date;

        _date.setUTCFullYear(Number(dateParts[0]));
        _date.setUTCMonth(Number(dateParts[1])-1);
        _date.setUTCDate(Number(dateParts[2]));
        _date.setUTCHours(Number(timeHours));
        _date.setUTCMinutes(Number(timeSubParts[1]));
        _date.setUTCSeconds(Number(timeSecParts[0]));
        if (timeSecParts[1]) {
            _date.setUTCMilliseconds(Number(timeSecParts[1]));
        }

        // by using setUTC methods the date has already been converted to local time(?)
        return _date;

    }

});


