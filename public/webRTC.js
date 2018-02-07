
let local = false;

let socket = io(local ? "http://localhost:8080" : "https://nodejswebrtc.herokuapp.com");

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
            playStream("remoteStream2", stream);

        });

        // openStream().then(stream => {
        //     playStream("localStream", stream);
        //     pc.answer(stream);
        // });

        pc.answer(); // answer with canvas stream is error
    });

});

$("#btnCall").click(function () {
    // openStream().then(stream => {
    //     // playStream("localStream", stream);
    //
    //     let pc = peer.call($("#remoteId").val(), stream);
    //
    //     pc.on("stream", stream => {
    //         playStream("remoteStream", stream);
    //     });
    // });

    let pc = peer.call($("#remoteId").val(), stream);

    pc.on("stream", stream => {
        playStream("remoteStream2", stream);
    });
});

var type;
if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
    type = 'video/webm; codecs=vp9';
} else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
    type = 'video/webm; codecs=vp8';
}

var chunks;

function recorder(stream, duration) {
    let mediaRecorder = new MediaRecorder(stream, {mimeType: type});
    // let mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.onstart = e => {
        chunks = [];
    };
    mediaRecorder.ondataavailable = e => {
        chunks.push(e.data);

        // let blob = new Blob([e.data], { type:type });
        // socket.emit('stream', e.data);
    };
    mediaRecorder.onstop = e => {
        let blob = new Blob(this.chunks, { type:type });
        socket.emit('stream', blob);
        // play();

        mediaRecorder.start();
        setTimeout(function() {
            mediaRecorder.stop()
        }, 1000);

        // recorder(stream, 3000);
    };

    mediaRecorder.start();

    setTimeout(function() {
        mediaRecorder.stop()
    }, duration || 1000);
}

function play(arrayBuffer) {
    let superBuffer = !arrayBuffer ? new Blob(chunks) : new Blob([arrayBuffer], { type: type });

    remoteStream.src = URL.createObjectURL(superBuffer);
    remoteStream.play();
}

var arrayBufferList = [];

socket.on("stream", arrayBuffer => {
    console.log("stream", arrayBuffer);

    // sourceBuffer.appendBuffer(arrayBuffer);

    arrayBufferList.push(arrayBuffer);

    while (arrayBufferList.length > 3) arrayBufferList.shift();

    if(arrayBufferList.length === 3 && remoteStream.paused) {
        // remoteStream.play();
        play(arrayBufferList.shift());
    }

    // play(arrayBuffer);

});

let video = document.getElementById("localStream");
let video2 = document.getElementById("video2");
let remoteStream = document.getElementById("remoteStream");

remoteStream.onended = () => {
    if(arrayBufferList.length > 0) {
        play(arrayBufferList.shift());
        // alert(arrayBufferList.shift());
    }

    // alert(remoteStream.paused);
};

let sourceBuffer;
let mediaSource = new MediaSource();
remoteStream.src = window.URL.createObjectURL(mediaSource);
mediaSource.addEventListener('sourceopen', function(e) {
    sourceBuffer = mediaSource.addSourceBuffer(type);
    console.log("sourceopen");
}, false);

let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');

// set canvas size = video size when known
// video.addEventListener('loadedmetadata', function() {
//     canvas.width = video.videoWidth;
//     canvas.height = video.videoHeight;
// });

video.addEventListener('play', function() {
    (function loop() {
        if (!video.paused && !video.ended) {
            ctx.drawImage(video, 0, 0);

            ctx.font = "30px Arial";
            ctx.fillText("Hello World",10,50);

            if (!video2.paused && !video2.ended) ctx.drawImage(video2, canvas.width/2, canvas.height/2, canvas.width/2, canvas.height/2);

            setTimeout(loop, 1000 / 30); // drawing at 30fps

            // console.log(ctx.getImageData(0,0,canvas.width,canvas.height));
            // socket.emit('stream', ctx.getImageData(0,0,canvas.width,canvas.height));

            // var dataURL = canvas.toDataURL("image/png");
            // console.log(dataURL);
        }
    })();

}, 0);

let remoteCanvas = document.getElementById('remoteCanvas');
let remoteCtx = remoteCanvas.getContext('2d');

remoteStream.addEventListener('play', function() {
    (function loop() {
        if (!remoteStream.paused && !remoteStream.ended) {
            remoteCtx.drawImage(remoteStream, 0, 0);

            setTimeout(loop, 1000 / 30); // drawing at 30fps
        }
    })();
}, 0);

var stream = canvas.captureStream(30);

openStream().then(stream => {
    video.srcObject = stream;
    video.play();

    video2.srcObject = stream;
    video2.play();
});

let music = document.getElementById('music');
let music2 = document.getElementById('music2');

var num = 0;
var audioMixer;
var mixer = () => {
    num++;
    if(num !== 2) return;
    console.log("mixer", num);

    // console.log(music.captureStream().getAudioTracks());
    // console.log(music2.captureStream().getAudioTracks());

    audioMixer = new MultiStreamsMixer([music.captureStream(), music2.captureStream()]);
    // console.log(audioMixer.getMixedStream().getAudioTracks());
    console.log(audioMixer.getMixedAudioStream().getAudioTracks());

    document.getElementById('music3').src = URL.createObjectURL(audioMixer.getMixedStream());

    // this.stream.addTrack(music.captureStream().getAudioTracks()[0]);
    // this.stream.addTrack(audioMixer.getMixedStream().getAudioTracks()[0]);
    this.stream.addTrack(audioMixer.getMixedAudioStream().getAudioTracks()[0]);

    recorder(this.stream);
};

music.addEventListener('play', mixer, 0);
music2.addEventListener('play', mixer, 0);

/////////////////////////////////////////////////////// Upload file
ss.forceBase64 = true;

$('#file').change(function(e) {
    let file = e.target.files[0];

    let blobStream = ss.createBlobReadStream(file);
    blobStream.on('data', function(chunk) {
        // size += chunk.length;
        // console.log(Math.floor(size / file.size * 100) + '%');
        // -> e.g. '42%'
    });

    let stream = ss.createStream();
    ss(socket).emit('stream', stream);
    blobStream.pipe(stream);
});
