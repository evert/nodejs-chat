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
            if (!this.get('gravatar')) {
                this.set({ gravatar: 'http://www.gravatar.com/avatar/7d76e2bb6f8c962a5628093c9f5bc6fb'});
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

            if (!this.get('gravatar')) {
                this.set({ gravatar: 'http://www.gravatar.com/avatar/7d76e2bb6f8c962a5628093c9f5bc6fb'});
            }

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

            newElem.find('.author').text(message.get('author'));

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
                backgroundImage: "url('" + message.get('gravatar') + "?s=55')"
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
     * You must pass a 'collection' option, which should be an instance of
     * MessageCollection
     */
    window.ChatApp.MessageInputView = Backbone.View.extend({

        events: {
            "click button" : "submitMessage"
        },

        initialize : function() {

            if (!this.collection) {
                throw "To initialize the MessageList view, you must pass the 'collection' option.";
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
            this.collection.add(message);

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

        },

        addUser : function(user) {

            var newElem = this.$('li.template').clone();
            newElem.removeClass('template');

            newElem.text(user.get('nickName'));

            newElem.css({
                backgroundImage: "url('" + user.get('gravatar') + "?s=25')"
            });
            this.el.append(newElem);

        },

        
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

        el: 'body',

        initialize : function() {

            this.messageCollection = new ChatApp.MessageCollection();
            this.userCollection = new ChatApp.UserCollection();
            this.messageListView = new ChatApp.MessageListView({
                collection: this.messageCollection,
                el : this.$('section.messages')
            });
            this.messageInputView = new ChatApp.MessageInputView({
                collection: this.messageCollection,
                el: this.$('section.inputArea')
            }); 
            this.userListView = new ChatApp.UserListView({
                collection: this.userCollection,
                el: this.$('section.userList')
            }); 

            this.userCollection.add({
                nickName : 'TAFKAP'
            });

        },

    });

    window.ChatApp.application = new ChatApp.Application;
   

});
