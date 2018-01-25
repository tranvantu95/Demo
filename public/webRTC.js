
let local = true;

let socket = io(local ? "http://localhost:2310" : "https://nodejswebrtc.herokuapp.com");

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

var type;
if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
    type = 'video/webm; codecs=vp9';
} else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
    type = 'video/webm; codecs=vp8';
}

var chunks;

function recorder(stream) {
    let mediaRecorder = new MediaRecorder(stream, {mimeType: type});
    mediaRecorder.onstart = e => {
        chunks = [];
    };
    mediaRecorder.ondataavailable = e => {
        chunks.push(e.data);
    };
    mediaRecorder.onstop = e => {
        let blob = new Blob(this.chunks, { type:type });
        socket.emit('stream', blob);
        // play();

        // mediaRecorder.start();
        // setTimeout(function() {
        //     mediaRecorder.stop()
        // }, 3000);

        // recorder(stream);
    };

    mediaRecorder.start();
    setTimeout(function() {
        mediaRecorder.stop()
    }, 3000);
}

openStream().then(stream => {
    playStream("localStream", stream);

    recorder(stream);
});

function play(arrayBuffer) {
    let superBuffer = !arrayBuffer ? new Blob(chunks) : new Blob([arrayBuffer], { type: type });

    let video = document.getElementById("remoteStream");
    video.src = URL.createObjectURL(superBuffer);
    video.play();
}

socket.on("stream", arrayBuffer => {
    console.log("stream", arrayBuffer);

    sourceBuffer.appendBuffer(arrayBuffer);
    if(video.paused) {
        video.play();
    }

    // play(arrayBuffer);
});

let sourceBuffer;
let mediaSource = new MediaSource();
let video = document.getElementById("remoteStream");
video.src = window.URL.createObjectURL(mediaSource);

mediaSource.addEventListener('sourceopen', function(e) {
    sourceBuffer = mediaSource.addSourceBuffer(type);
    console.log("sourceopen");
}, false);

///////////////////////////////////////////////////////
ss.forceBase64 = true;

$('#file').change(function(e) {
    let file = e.target.files[0];

    // let stream = ss.createStream();
    // ss(socket).emit('stream', stream);
    // ss.createBlobReadStream(file).pipe(stream);

    let blobStream = ss.createBlobReadStream(file, {type:type});
    blobStream.on('data', function(chunk) {
        // size += chunk.length;
        // console.log(Math.floor(size / file.size * 100) + '%');
        // -> e.g. '42%'

        console.log(chunk, chunk.buffer);

        // sourceBuffer.appendBuffer(chunk.buffer);
        // if(video.paused) {
        //     video.play();
        // }

    });
});
