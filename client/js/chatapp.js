/**
 * Using jQuery's DOM.ready
 */
$(function() {

    /**
     * Message Model
     * ===================
     *
     * The message model represents a single message.
     *
     * Messages have a 'dateTime', a 'nickName' and a 'content' attribute. 
     */
    window.Message = Backbone.Model.extend({

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
    window.MessageCollection = Backbone.Collection.extend({
        
        model: Message

    });


    /**
     * MessageList view
     * ================
     *
     * This view is responsible for updating the list of messages.
     * You must pass a 'collection' option, which should be an instance of
     * MessageCollection
     */
    window.MessageListView = Backbone.View.extend({

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
    window.MessageInputView = Backbone.View.extend({

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

            // Adding a new message to the collection 
            this.collection.add(message);

            // Resetting the input field
            input.val(''); 

        } 

    });

    window.ChatApp = Backbone.View.extend({

        messageCollection : null,
        messageListView : null,
        messageInputView : null,

        el: 'body',

        initialize : function() {

            this.messageCollection = new MessageCollection();
            this.messageListView = new MessageListView({
                collection: this.messageCollection,
                el : this.$('section.messages')
            });
            this.messageInputView = new MessageInputView({
                collection: this.messageCollection,
                el: this.$('section.inputArea')
            }); 

        },

    });

    window.chatApp = new ChatApp;
   

});
