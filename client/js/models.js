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

