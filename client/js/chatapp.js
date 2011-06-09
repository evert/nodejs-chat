/**
 * Using jQuery's DOM.ready
 */
$(function() {

    /**
     * ChatApp namespace
     * ================
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
     *
     * Messages have a 'dateTime', a 'nickName' and a 'content' attribute. 
     */
    window.ChatApp.Message = Backbone.Model.extend({

        initialize : function() {

            // If no date/time was set, we assume this message is created 'now'.
            if (!this.get('dateTime')) {
                this.set({ dateTime: new Date() });
            }

        }        

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
     */
    window.ChatApp.User = Backbone.Model.extend({

        initialize : function() {


        }

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
     */
    window.ChatApp.Connection = function(userCollection, messageCollection, nickName, email) {

        this.userCollection = userCollection;
        this.messageCollection = messageCollection;
        this.nickName = nickName;
        this.email = email;

        this.listen();
        this.join();

    };
    _.extend(window.ChatApp.Connection.prototype, Backbone.Events, {

        userCollection : null,
        messageCollection : null,
        lastSequence : 0,

        listen : function() {

            var self = this;

            $.ajax('/eventpoll?since=' + this.lastSequence + '&nickName=' + this.nickName + '&email=' + this.email, {
                dataType : 'json',
                complete : function(jqXHR, textStatus) {
                    self.listen();
                },
                success : function(data) {
                    for(var ii=0;ii<data.length;ii++) {
                        var event = data[ii];
                        self.lastSequence = event.sequence;
                        switch(event.type) {

                            case 'message' :
                                self.messageCollection.add({
                                    message : event.message,
                                    nickName : event.nickName,
                                    dateTime : new Date(event.dateTime),
                                    gravatar : event.gravatar
                                });
                                break;
                            case 'join' :
                                self.userCollection.add({
                                    nickName : event.nickName,
                                    gravatar : event.gravatar
                                });
                                break;
                            case 'part' :
                                self.userCollection.remove(
                                    self.userCollection.find(
                                        function(item) { return item.get('nickName') === event.nickName; }
                                    )
                                );
                                break;

                        }
                    }
                }

            });

        },

        join : function() {

            $.ajax('/join?nickName=' + this.nickName + '&email=' + this.email);

        },

        message : function(message) {

            $.ajax('/message?nickName=' + this.nickName + '&email=' + this.email + '&message=' + message);

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

        },

        
    });

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


        },

    });

    window.ChatApp.application = new ChatApp.Application;
   

});
