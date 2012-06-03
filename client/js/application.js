/**
 * This is the main application class
 *
 * This class is responsible for doing all the initialization
 * of the application, as well as tying objects together.
 */
ChatApp.Application = function() {

    this.initModels();
    this.initConnection();
    this.initViews();

}

ChatApp.Application.prototype = {

    /**
     * Models
     */
    userList : null,
    messageList : null,

    /**
     * Connection
     */
    connection : null,

    /**
     * In this function models, or in this case specifically..
     * collections are being created.
     */
    initModels : function() {

        this.userList = new ChatApp.Model.UserList();
        this.messageList = new ChatApp.Model.MessageList();

    },

    /**
     * In this function all the views are created.
     */
    initViews : function() {

        var welcomeView = new ChatApp.View.Welcome({
            el : $('section.welcome'),
        });
        this.userListView = new ChatApp.View.UserList({
            el : $('section.userList'),
            collection : this.userList
        });
        this.inputAreaView = new ChatApp.View.InputArea({
            el : $('section.inputArea')
        });
        this.messageListView = new ChatApp.View.MessageList({
            el : $('section.messages'),
            collection : this.messageList
        });


        welcomeView.on('submit', function(userInfo) {
            this.connection.connect(userInfo.nickName, userInfo.email);
        });
        inputAreaView.on('message', function(message) {
            this.connection.message(message);
        });

    },

    /**
     * In this function the server connection is created.
     */
    initConnection : function() {

        this.connection = new ChatApp.Connection(
            this.userList,
            this.messageList
        );

    }

}
