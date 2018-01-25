var express = require("express");
var app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", "./views");

var server = require("http").Server(app);
server.listen(process.env.PORT || 2310);

app.get("/", function (req, res) {
    // res.render("trangchu");
    res.render("webRTC");
});

// var PeerServer = require("./peer-server");
// var peerServer = new PeerServer(server);

var fs = require('fs');

var io = require("socket.io")(server);
var ss = require('socket.io-stream');
ss.forceBase64 = true;

var nsp = io.of('/my-namespace');

nsp.on('connection', function(socket){
    console.log("namespace connection " + socket.id);
});

var users = [];

io.on("connection", function (socket) {
    console.log("connection", socket.id);
    // console.log(socket.adapter.rooms); // get all rooms
    // console.log(io.sockets.adapter.rooms); // get all rooms

    /*------------------------------WebRTC---------------------------------------------------*/
    socket.emit("connection");

    socket.on("peer-call-peer", function (data) {
        console.log(socket.id, "call", data.peerId);
        io.to(data.peerId).emit("call", {peerId: socket.id, desc: data.desc});
    });

    socket.on("peer-answer-peer", function (data) {
        console.log(socket.id, "answer", data.peerId);
        io.to(data.peerId).emit("answer", {peerId: socket.id, desc: data.desc});
    });

    socket.on("peer-send-candidate-to-peer", function (data) {
        console.log(socket.id, "send-candidate", data.peerId);
        io.to(data.peerId).emit("candidate", {peerId: socket.id, candidate: data.candidate});
    });
    /*------------------------------WebRTC---------------------------------------------------*/

    socket.on("stream", buffer => {
        console.log("stream", buffer);
        socket.emit("stream", buffer);

        let ws = fs.createWriteStream('video.webm');
        ws.write(buffer);
        ws.end();
    });

    // ss(socket).on("stream", stream => {
    //     console.log("stream " + stream);
    //     stream.pipe(fs.createWriteStream('video.webm'));
    //
    //     let _stream = ss.createStream();
    //     socket.emit("stream", _stream);
    //     stream.pipe(_stream);
    // });

    // var rooms = [];
    // for(var roomName in io.sockets.adapter.rooms) rooms.push(roomName);
    // console.log("all rooms: ", roomName);

    // socket.join("room_name"); // create or join to room
    // socket.leave("room_name"); // leave or delete room


    socket.on("disconnect", function () {
        console.log("disconnect", socket.id);
    });

    socket.on("Client-send-data", function (data) {
        console.log(data);

        // socket.emit("Server-send-data", data); // send to this socket
        // socket.broadcast.emit("Server-send-data", data); // send to other sockets
        // io.sockets.emit("Server-send-data", data); // send to all sockets
        // io.sockets.in("room_name").emit("Server-send-data", data); // send to room
        // io.to("socket_id").emit("Server-send-data", data); // send to socket_id
    });

    socket.on("client-send-username", function (username) {
        console.log(username);

        if(users.indexOf(username) >= 0) {
            socket.emit("server-send-register-failed");
        }
        else {
            users.push(username);
            socket.username = username;
            socket.emit("server-send-register-success", username);

            io.sockets.emit("server-send-users-list", users);

        }
    });

    socket.on("client-send-logout", function () {
        users.splice(users.indexOf(socket.username), 1);
        socket.username = undefined;
        socket.emit("server-send-logout-success");

        socket.broadcast.emit("server-send-users-list", users);
    });

    socket.on("client-send-message", function (message) {
        io.sockets.emit("server-send-message", {username:socket.username, message:message});
        // io.sockets.in("room_name").emit("server-send-message", {username:socket.username, message:message});
    });
});
