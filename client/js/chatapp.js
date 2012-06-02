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
