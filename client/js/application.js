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

        /* The 'welcome' view */

        //var welcomeView = new ChatApp.View.Welcome({
        //    el : $('section.welcome'),
        //});

        /* The 'userlist' view */

        //var userListView = new ChatApp.View.UserList({
        //    el : $('section.userList'),
        //    collection : this.userList
        //});

        /* The 'inputArea' view */


        /* The 'messagelist' view */

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
