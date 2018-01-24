
let local = false;

let socket = io(local ? "http://localhost:8080" : "https://nodejswebrtc.herokuapp.com");
// var socketStream = ss.createStream();

function openStream() {
    const config = {audio:false, video:true};
    return navigator.mediaDevices.getUserMedia(config);
}

function playStream(videoId, stream) {
    const video = document.getElementById(videoId);
    video.srcObject = stream;
    video.play();
}

let peer = new Peer(socket);

peer.on("connection", () => {
    console.log("peerId", peer.id);
    $("#peer_id").html(peer.id);

    peer.on("call", pc => {

        pc.on("stream", stream => {
            playStream("remoteStream", stream);
        });

        openStream().then(stream => {
            playStream("localStream", stream);
            pc.answer(stream);
        });
    });

});

$("#btnCall").click(function () {
    openStream().then(stream => {
        playStream("localStream", stream);

        let pc = peer.call($("#remoteId").val(), stream);

        pc.on("stream", stream => {
            playStream("remoteStream", stream);
        });
    });
});

