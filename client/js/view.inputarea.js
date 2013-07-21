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

    /**
     * This method is called when the form is submitted.
     */
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
