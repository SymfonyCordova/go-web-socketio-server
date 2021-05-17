'use strict'

var localVideo = document.querySelector('video#localvideo');
var remoteVideo = document.querySelector('video#remotevideo');

var btnConn = document.querySelector('button#connserver');
var btnLeave = document.querySelector('button#leave');

var localStream;
var roomId;
var socket = null;
var state = 'init'
var pc = null;

btnConn.disabled = false;
btnLeave.disabled = true;

function createPeerConnection(){
	console.log("create RTCPeerConnection!");
	
	if(!pc){
		var pcConfig = {
			'iceServers':[
				{
					'urls':'stun:turn.mostyout.com',
					'credential':'123456',
					'username':'webrtc',
				},
			],
		};
		
		pc = new RTCPeerConnection(pcConfig);
		
		pc.onicecandidate = (e) => {
			if(e.candidate){
				console.log("发现新的candidate", e.candidate)
			}
		};
		
		pc.ontrack = (e) => {
			remoteVideo.srcObject = e.streams[0];
		}
	}
	
	if(localStream){
		localStream.getTracks().forEach((track) => {
			pc.addTrack(track);
		});
	}
}

function destoryPeerConnection(){
	console.log("destory RTCPeerConnection!");
	if(pc){
		pc.close();
		pc = null;
	}
}

function conn(){
	socket = io.connect("ws://127.0.0.1:8080",{
	  autoConnect: true,
	  transports:['websocket'],
	});
	//////////////////////接收消息/////////////////////////
	//发送join请求加入房间后，服务器回复joined表示加入房间成功
	socket.on('joined', (message)=>{
		console.log('receive joined message: ', message);
		
		state = "joined";
		
		createPeerConnection();
		
		btnConn.disabled = true;
		btnLeave.disabled = false;
		
		console.log("receive joined message:state = ",state)
	});
	
	//表示第二个人也加入进来了
	socket.on('otherjoin', (message)=>{
		console.log('receive otherjoin message: ', message);
		
		if(state === 'joined_unbind'){
			createPeerConnection();
		}
		
		state="joined_conn";
		
		//媒体协商
		console.log("receive otherjoin message:state=",state)
	});
	
	//发送join请求加入房间后，房间已经满了
	socket.on('full', (message)=>{
		console.log('receive full message: ', message);
		
		state = "leaved";
		
		socket.disconnect();
		
		btnConn.disabled=false;
		btnLeave.disabled=true;
		
		console.log("receive full message:state=",state);
		
		alert("房间满了");
	});
	
	//本人发送leave请求离开房间后，服务器回复leaved表示已经离开
	socket.on('leaved', (message)=>{
		console.log('receive leaved message: ', message);
		
		state = "leaved";
		
		socket.disconnect();
		
		btnConn.disabled=false;
		btnLeave.disabled=true;
		
		console.log("receive leaved message:state=",state);
	});

	//别人发送leave请求加入房间后，服务器告诉当前客户端对方跟你说拜拜了
	socket.on('bye', (message)=>{
		console.log('receive bye message: ', message);
		
		state = 'joined_unbind';

		destoryPeerConnection();
		
		console.log('receive bye message:state=', message);
	});
	
	//双方发送消息
	socket.on('message', (message)=>{
		console.log('receive mm message: ', message);
		//媒体协商
	});
	
	///////////发送消息///////////////////
	socket.emit('join', {id:1, channel:"ROOM_高三1班_503", text:"请求加入房间"});
	return;
}

function getMediaStream(stream){
	localStream = stream;
	localVideo.srcObject=localStream;
	
	conn();
}

function handleError(err){
	console.error("navigator.mediaDevices.getUserMedia failed: ", err)
}

function start(){
	if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
		console.error("the getUserMedia is not supported!")
		return false;
	}else{
		var constraints = {
			video:true,
			audio : false,
		};
		navigator.mediaDevices.getUserMedia(constraints)
			.then(getMediaStream)
			.catch(handleError)
	}
}

function connSignalServer(){
	//开启本地视频
	start();
	return true;	
}

btnConn.onclick = connSignalServer;

function closeLocalMedia(){
	if(localStream && localStream.getTracks()){
		localStream.getTracks().forEach((track)=>{
			track.stop();
		});
	}
	
	localStream = null;
}

function leave(){
	if(socket){
		socket.emit("leave", {id: 200, channel:"ROOM_高三1班_503", text:"请求离开房间"})
	}
	
	//释放资源
	destoryPeerConnection();
	
	btnConn.disabled = false;
	btnLeave.disabled = true;
}

btnLeave.onclick = leave;

