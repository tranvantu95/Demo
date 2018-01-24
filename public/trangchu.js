// var socket = io("http://localhost:8080/my-namespace");
var socket = io("http://localhost:8080");

socket.on("server-send-register-failed", function () {
    alert("Dang ki that bai");
});

socket.on("server-send-register-success", function (username) {
    $("#loginForm").hide(2000);
    $("#chatForm").show(1000);

    $("#currentUser").html(username);
});

socket.on("server-send-logout-success", function () {
    $("#loginForm").show(1000);
    $("#chatForm").hide(2000);
});

socket.on("server-send-users-list", function (users) {
    $("#boxContent").html("");
    users.forEach(function (value) {
      $("#boxContent").append("<div class='user'>" + value + "</div>")
    });
});

socket.on("server-send-message", function (data) {
    $("#listMessages").append("<div class='ms'>" + data.username + ": " + data.message + "</div>")
});

$(document).ready(function () {
    $("#loginForm").show();
    $("#chatForm").hide();
    
    $("#btnRegister").click(function () {
        socket.emit("client-send-username", $("#txtUsername").val());
    });

    $("#btnLogout").click(function () {
        socket.emit("client-send-logout");
    });

    $("#btnSendMessage").click(function () {
        socket.emit("client-send-message", $("#txtMessage").val());
    });
})