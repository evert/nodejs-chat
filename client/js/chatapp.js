/**
 * ChatApp namespace
 * =================
 *
 * The ChatApp namespace contains all the other objects in this
 * application.
 */
window.ChatApp = { };

/**
 * Message Model
 * ===================
 *
 * The message model represents a single message.
 * Messages have the following attributes:
 *   - nickName
 *   - gravatar
 *   - message
 *   - dateTime
 */
window.ChatApp.Message = Backbone.Model.extend({

});

/**
 * Message Collection 
 * ===================
 *
 * The messages collection contains the list of messages.
 */
window.ChatApp.MessageCollection = Backbone.Collection.extend({
    
    model: ChatApp.Message

});

/**
 * User Model
 * ==========
 *
 * The users model represents a single (online) user.
 * Users have the following attributes:
 *   - nickName
 *   - gravatar
 */
window.ChatApp.User = Backbone.Model.extend({


});

/**
 * User Collection 
 * ===============
 *
 * The user collection contains the list of online users.
 */
window.ChatApp.UserCollection = Backbone.Collection.extend({
    
    model: ChatApp.User

});

/**
 * Connection
 * ==========
 *
 * The connection is responsible for connecting to the server, sending
 * messages and receiving events.
 *
 * To operate correctly, the following constructor arguments must be passed:
 *   - userCollection (an instance of ChatApp.UserCollection)
 *   - messageCollection (an instance of ChatApp.MessageCollection)
 *   - nickName (the current users' nickname)
 *   - email (the current users' email address)
 */
window.ChatApp.Connection = function(userCollection, messageCollection, nickName, email) {

    this.userCollection = userCollection;
    this.messageCollection = messageCollection;
    this.nickName = nickName;
    this.email = email;

    var self = this;
    this.join(function() {
        self.listen();
    });

};
/**
 * Extending the Backbone 'Events' object
 */
_.extend(window.ChatApp.Connection.prototype, Backbone.Events, {

    userCollection : null,
    messageCollection : null,
    lastSequence : 0,

    /**
     * Calling the listen function will open up a long-polling connection to
     * the chat server.
     */
    listen : function() {

        var self = this;

        /**
         * The HTTP long polling request, using jQuery's ajax function
         */
        $.ajax('/eventpoll?since=' + this.lastSequence + '&nickName=' + this.nickName + '&email=' + this.email, {
            dataType : 'json',
            complete : function(jqXHR, textStatus) {
                self.listen();
            },
            success : function(data) {
                self.parseEvents(data);
            }
        });
    },

    /**
     * Calling the join function will let the server know we're here, and cause
     * the current user to be added to the userlist.
     */
    join : function(onSuccess) {

        $.ajax('/join?nickName=' + this.nickName + '&email=' + this.email, { success: onSuccess });

    },

    /**
     * The message function sends a chat-message to the server
     */
    message : function(message) {

        $.ajax('/message?nickName=' + this.nickName + '&email=' + this.email + '&message=' + message);

    },

    /**
     * parseEvent is called by listen. This function loops through a list of
     * events and call the appropriate actions on the user and message
     * collection.
     */
    parseEvents : function(events) {

        for(var ii=0;ii<events.length;ii++) {
            var event = events[ii];
            this.lastSequence = event.sequence;
            switch(event.type) {

                case 'message' :
                    console.log('MESSAGE: ' + event.nickName);
                    this.messageCollection.add({
                        message : event.message,
                        nickName : event.nickName,
                        dateTime : window.ChatApp.parseISO8601(event.dateTime),
                        gravatar : event.gravatar
                    });
                    break;

                case 'join' :
                    console.log('JOIN: ' + event.nickName);
                    this.userCollection.add({
                        nickName : event.nickName,
                        gravatar : event.gravatar
                    });
                    break;

                case 'part' :
                    console.log('PART: ' + event.nickName);
                    this.userCollection.remove(
                        this.userCollection.find(
                            function(item) { return item.get('nickName') === event.nickName; }
                        )
                    );
                    break;
                
                default :
                    console.log('Unknown event: ' + event.type);
                    break;

            }
        }

    }


});

/**
 * MessageList view
 * ================
 *
 * This view is responsible for updating the list of messages.
 * You must pass a 'collection' option, which should be an instance of
 * MessageCollection
 */
window.ChatApp.MessageListView = Backbone.View.extend({

    initialize : function() {

        if (!this.collection) {
            throw "To initialize the MessageList view, you must pass the 'collection' option.";
        }

        var self = this;
        this.collection.bind('add', function(message) {
            self.addMessage(message);
        }); 

    },

    addMessage : function(message) {

        var newElem = this.$('li.template').clone();
        newElem.removeClass('template');

        newElem.find('.nickName').text(message.get('nickName'));

        var ft = message.get('dateTime');

        var hour = ft.getHours();
        var min = ft.getMinutes();
        if (min<10) min = '0' + min;
        var sec = ft.getSeconds();
        if (sec<10) sec = '0' + sec;

        formattedTime = hour + ':' + min + ':' + sec;

        newElem.find('time').text(formattedTime);
        newElem.find('p').text(message.get('message'));
        newElem.css({
            backgroundImage: "url('" + message.get('gravatar') + "?s=55&d=retro')"
        });
        this.el.append(newElem);

        this.el.scrollTop(this.el[0].scrollHeight);

    }
    
});


/**
 * MessageInput view
 * ================
 *
 * This view is responsible for the 'input' area, which allows the user to
 * send a message to the chatroom.
 *
 * You must pass a 'connection' option, which should be an instance of
 * ChatApp.connection 
 */
window.ChatApp.MessageInputView = Backbone.View.extend({

    events: {
        "submit form" : "submitMessage"
    },

    initialize : function() {

        if (!this.options.connection) {
            throw "To initialize the MessageInputView, you must pass the 'connection' option.";
        }

    },

    submitMessage : function(evt) {

        evt.preventDefault();

        var input = this.$('input');

        var message = {
            message: input.val()
        };

        if (message.message.length < 1) return;

        // Adding a new message to the collection 
        this.options.connection.message(message.message);

        // Resetting the input field
        input.val(''); 

    } 

});
    
/**
 * UserList view
 * ================
 *
 * This view is responsible for keeping the list of online users up to
 * date. 
 * You must pass a 'collection' option, which should be an instance of
 * UserCollection
 */
window.ChatApp.UserListView = Backbone.View.extend({

    initialize : function() {

        if (!this.collection) {
            throw "To initialize the MessageList view, you must pass the 'collection' option.";
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

        var newElem = this.$('li.template').clone();
        newElem.removeClass('template');

        newElem.text(user.get('nickName'));
        newElem.attr('id','user-' + user.get('nickName'));

        newElem.css({
            backgroundImage: "url('" + user.get('gravatar') + "?s=25&d=retro')"
        });
        this.el.append(newElem);

    },

    removeUser : function(user) {

        $('#user-' + user.get('nickName')).remove();

    }

});

/**
 * The WelcomeView is responsible for handling the login screen
 */
window.ChatApp.WelcomeView = Backbone.View.extend({

    events : {
        "submit form" : "connect"
    },

    connect : function(evt) {

        evt.preventDefault();
        this.el.hide();
        var nickName = this.$('input[name=nickName]').val();
        var email = this.$('input[name=email]').val();

        this.trigger('connect', {
            nickName : nickName,
            email : email
        });

    }

});

/**
 * The Application View
 * ====================
 *
 * The Application View is basically the main Application controller, and
 * is responsible for setting up all the other objects.
 */
window.ChatApp.Application = Backbone.View.extend({

    messageCollection : null,
    userCollection : null,

    messageListView : null,
    messageInputView : null,
    userListView : null,
    welcomeView : null,

    connection : null,

    nickName : null,
    email : null,

    el: 'body',

    initialize : function() {

        var self = this;

        this.messageCollection = new ChatApp.MessageCollection();
        this.userCollection = new ChatApp.UserCollection();



        this.welcomeView = new ChatApp.WelcomeView({
            el : this.$('section.welcome')
        });
        this.welcomeView.bind('connect', function(userInfo) {
            self.nickName = userInfo.nickName;
            self.email = userInfo.email;
            self.initializeConnection();
        });

    },

    initializeConnection : function() {

        this.connection = new ChatApp.Connection(this.userCollection, this.messageCollection, this.nickName, this.email);

        this.messageListView = new ChatApp.MessageListView({
            collection: this.messageCollection,
            el : this.$('section.messages')
        });
        this.messageInputView = new ChatApp.MessageInputView({
            connection: this.connection,
            el: this.$('section.inputArea')
        }); 
        this.userListView = new ChatApp.UserListView({
            collection: this.userCollection,
            el: this.$('section.userList')
        });


    }

});

/**
 * Parse a UTC date in ISO 8601 format to a Date object.
 *
 * Because ISO 8601 is not officially supported (and doesnt work in latest Safari).
 *
 * @url http://anentropic.wordpress.com/2009/06/25/javascript-iso8601-parser-and-pretty-dates/
 *
 * @param String str
 */
window.ChatApp.parseISO8601 = function(str) {
    var parts = str.split('T'),
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
};

/**
 * Using jQuery's DOM.ready to fire up the application.
 */
$(document).ready(function() {

    window.ChatApp.application = new ChatApp.Application;


});
