
class Peer {
    constructor(socket) {
        this.callbacks = {};

        this.peers = {};

        this.socket = socket;

        this.socket.on("connection", () => {
            this.id = this.socket.id;
            this.fire("connection");

            this.socket.on("call", data => {
                console.log("onCall", data.peerId);
                let pc = this.connect(data.peerId);
                pc.pc.setRemoteDescription(new RTCSessionDescription(data.desc));
                this.fire("call", pc);
            });

            this.socket.on("answer", data => {
                console.log("onAnswer", data.peerId);
                let pc = this.peers[data.peerId];
                if(pc) pc.pc.setRemoteDescription(new RTCSessionDescription(data.desc));
            });

            this.socket.on("candidate", data => {
                console.log("onIceCandidate", data.peerId);
                let pc = this.peers[data.peerId];
                if(pc) pc.pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            });
        });
    }

    connect(peerId) {
        let pc = new RTCPeerConnection({});

        pc.onicecandidate = evt => {
            console.log("send candidate", evt.candidate);
            if(evt.candidate) this.socket.emit("peer-send-candidate-to-peer", {peerId:peerId, candidate:evt.candidate});
        };

        let peerConnection = new PeerConnection(pc, this.socket, peerId);
        this.peers[peerId] = peerConnection;

        return peerConnection;
    }

    call(peerId, stream) {
        let peerConnection = this.connect(peerId);
        let pc = peerConnection.pc;

        if(stream) pc.addStream(stream);

        pc.createOffer(desc => {
            pc.setLocalDescription(desc);
            this.socket.emit("peer-call-peer", {peerId:peerId, desc:desc});
            console.log("send desc", desc);
        }, error => {
            console.log("error", error);
        });

        return peerConnection;
    }

    on(name, callback) {
        this.callbacks[name] = callback;
    }

    fire(name, params) {
        let callback = this.callbacks[name];
        if(callback) callback(params);
    }
}

class PeerConnection {
    constructor(pc, socket, peerId) {
        this.callbacks = {};

        this.pc = pc;
        this.socket = socket;
        this.peerId = peerId;

        pc.onaddstream = evt => {
            this.fire("stream", evt.stream);
        };
    }

    answer(stream) {
        if(stream) this.pc.addStream(stream);

        this.pc.createAnswer(desc => {
            this.pc.setLocalDescription(desc);
            this.socket.emit("peer-answer-peer", {peerId:this.peerId, desc:desc});
            console.log("send desc", desc);
        }, error => {
            console.log("error", error);
        });
    }

    on(name, callback) {
        this.callbacks[name] = callback;
    }

    fire(name, params) {
        let callback = this.callbacks[name];
        if(callback) callback(params);
    }
}
