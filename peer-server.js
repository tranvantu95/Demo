class PeerServer {
    constructor(server) {
        let io = require("socket.io")(server);

        io.on("connection", function (socket) {
            console.log("peer connection " + socket.id);

            socket.emit("connection");

            socket.on("call-to-peer", function (data) {
                console.log(socket.id + " call " + data.peerId);
                io.to(data.peerId).emit("call", {peerId: socket.id, desc: data.desc});
            });

            socket.on("answer-to-peer", function (data) {
                console.log(socket.id + " answer " + data.peerId);
                io.to(data.peerId).emit("answer", {peerId: socket.id, desc: data.desc});
            });

            socket.on("send-candidate-to-peer", function (data) {
                console.log(socket.id + " send-candidate " + data.peerId);
                io.to(data.peerId).emit("candidate", {peerId: socket.id, candidate: data.candidate});
            });

        });
    }
}

module.exports = PeerServer;