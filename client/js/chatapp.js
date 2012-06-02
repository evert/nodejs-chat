/**
 * This is our top-level namespace. We will be placing all our objects under
 * this namespace.
 */
window.ChatApp = {
    View : {},
    Model : { }
}

/**
 * This is the socket.io server we will be connecting to.
 */
ChatApp.serverUrl = 'http://localhost:8080/';

/**
 * The User Model represents a single user.
 *
 * A user will have the following properties:
 *   id
 *   nickName
 *   gravatar
 */
ChatApp.Model.User = Backbone.Model.extend({

});

/**
 * The UserList collection manages the complete list of users.
 */
ChatApp.Model.UserList = Backbone.Collection.extend({

    model: ChatApp.Model.User

});

/**
 * The Message model represents a single message.
 *
 * A message will have the following properties:
 *   message
 *   userId (the user id)
 *   nickName (user's nickname)
 *   gravatar (user's gravatar url)
 *   time (A javascript Date object)
 */
ChatApp.Model.Message = Backbone.Model.extend({


});

/**
 * The MessageList collection manages the message history
 */
ChatApp.Model.MessageList = Backbone.Collection.extend({

    model: ChatApp.Model.Message

});


/**
 * The Welcome view is responsible for the login screen.
 *
 * The View basically waits for a submit event from the form. After this event
 * has been caught, it will trigger a 'submit' event.
 *
 * The submit event will get an object passed, containing two properties:
 *   - nickName
 *   - email
 */
ChatApp.View.Welcome = Backbone.View.extend({

    events : {

        "submit form" : "submit"

    },

    submit : function(ev) {

        // Making sure the browser doesn't submit the form
        ev.preventDefault();

        // Gathering form values
        var nickName = this.$('input[name=nickName]').val();
        var email = this.$('input[name=email]').val();

        // Triggering the 'submit' event
        this.trigger('submit', {
            nickName : nickName,
            email    : email
        });

        // Hiding the welcome screen
        this.$el.hide();

    }

});

/**
 * The userList renders the list of users on the side of the screen.
 *
 * It ensures that new users are added and removed when needed.
 */
ChatApp.View.UserList = Backbone.View.extend({

    initialize : function() {

        if (!this.collection) {
            throw "To initialize the UserList view, you must pass the 'collection' option.";
        }

        var self = this;

        this.collection.bind('add', function(user) {
            self.addUser(user);
        });
        this.collection.bind('remove', function(user) {
            self.removeUser(user);
        });

    },

    addUser : function(user) {

        // Creating a new element for the user
        var newElem = this.$('li.template').clone();
        newElem.removeClass('template');

        // The label
        newElem.text(user.get('nickName'));

        // The gravatar
        newElem.css({
                backgroundImage: "url('" + user.get('gravatar') + "?s=25&d=retro')"
        });

        // Adding the user id, for easy identification
        newElem.data('userId', user.get('id'));
        this.$el.append(newElem);

    },

    removeUser : function(user) {

        // We need to find the correct element, and remove it.
        this.$('li').each(function(key, elem) {
            elem = $(elem);
            if (elem.data('userId') == user.get('id')) {
                elem.remove();
            }
        });

    }

});

/**
 * The InputArea view responds to messages submitted by the user.
 *
 * It makes sure that when the user hits enter, a 'message' event will be
 * emitted.
 */
ChatApp.View.InputArea = Backbone.View.extend({

    events : {
        'submit form' : 'submit'
    },

    submit : function(ev) {

        ev.preventDefault();

        // Grabbing the current message
        var message = this.$('input').val();

        // Not sending empty messages
        if (message.length < 1) {
            return;
        }

        this.trigger('message',message);

        // Clearing the input field
        this.$('input').val('');

    }

});

/**
 * The messageList view is responsible for showing all the messages that came
 * the users.
 */
ChatApp.View.MessageList = Backbone.View.extend({

    initialize : function() {

        if (!this.collection) {
            throw "To initialize the MessageList view, you must pass the 'collection' option.";
        }
        var self = this;

        this.collection.bind('add', function(message) {
            self.addMessage(message);
        });

    },

    /**
     * This method is called whenver a new message was received from the server.
     */
    addMessage : function(message) {

        // Creating a new message element
        var newElem = this.$('li.template').clone();
        newElem.removeClass('template');

        // Setting the nickname
        newElem.find('.nickName').text(message.get('nickName'));

        // Setting the time
        var ft = message.get('time');
        var hour = ft.getHours();
        var min = ft.getMinutes();
        if (min<10) min = '0' + min;
        var sec = ft.getSeconds();
        if (sec<10) sec = '0' + sec;

        formattedTime = hour + ':' + min + ':' + sec;

        newElem.find('time').text(formattedTime);

        // Set the actual message itself
        newElem.find('p').text(message.get('message'));

        // Setting the users' gravatar
        newElem.css({
            backgroundImage: "url('" + message.get('gravatar') + "?s=55&d=retro')"
        });

        this.$el.append(newElem);

        // Scrolling all the way to the bottom
        this.$el.scrollTop(this.el.scrollHeight);

    }

});

ChatApp.Connection = function(userList, messageList) {

    this.userList = userList;
    this.messageList = messageList;

}
_.extend(window.ChatApp.Connection.prototype, Backbone.Events, {

    socket : null,
    userList : null,

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


/**
 * We only actually start executing the javascript, once the dom is fully
 * loaded. All the initialization for the application logic is done here.
 */
$(document).ready(function() {

    var userList = new ChatApp.Model.UserList();
    var messageList = new ChatApp.Model.MessageList();

    var welcomeView = new ChatApp.View.Welcome({
        el : $('section.welcome')
    });
    var userListView = new ChatApp.View.UserList({
        el : $('section.userList'),
        collection : userList
    });
    var inputAreaView = new ChatApp.View.InputArea({
        el : $('section.inputArea')
    });
    var messageListView = new ChatApp.View.MessageList({
        el : $('section.messages'),
        collection : messageList
    });

    var connection = new ChatApp.Connection(userList, messageList);

    welcomeView.on('submit', function(userInfo) {
        connection.connect(userInfo.nickName, userInfo.email);
    });
    inputAreaView.on('message', function(message) {
        connection.message(message);
    });

});
