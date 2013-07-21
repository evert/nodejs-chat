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
