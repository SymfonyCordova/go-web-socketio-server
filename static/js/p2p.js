'use strict'

var localVideo = document.querySelector('video#localvideo');
var remoteVideo = document.querySelector('video#remotevideo');

var btnConn = document.querySelector('button#connserver');
var btnLeave = document.querySelector('button#leave');

var bw = document.querySelector('select#bandwidth');

var localStream;
var roomId = "ROOM_高三1班_503";
var socket = null;
var state = 'init'
var pc = null;

btnConn.disabled = false;
btnLeave.disabled = true;

function getAnswer(desc){
	pc.setLocalDescription(desc);
	
	bw.disabled = false;//创建应答成功后可以开启控制速率的选项
	sendMessage(roomId, desc);
}

function handleAnswerError(err){
	console.error("创建SDP应答失败 ", err);
}

//13.发给对方
function sendMessage(roomId, data){
	console.log("send p2p message ", roomId, data);
	if(socket){
		socket.emit("message", {errCode:200, roomId:roomId, resource:data, Hint:"我给你的协商信息，请答复我"})
	}
}

function getOffer(desc){ //12.创建offer成功,向对方发送offer信息
	pc.setLocalDescription(desc);//先将自己的信息存在本地
	sendMessage(roomId, desc);//发给对方
}


function handleOfferError(err){
	console.error("create offer 失败")
}

function call(){
	if(state === 'joined_conn'){
		if(pc){
			var options = {
				offerToReceiveAudio:true,
				offerToReceiveVideo:true,
			};
			pc.createOffer(options)//11.媒体协商 创建offer
				.then(getOffer)
				.catch(handleOfferError);
		}
	}
}

function createPeerConnection(){
	console.log("create RTCPeerConnection!");
	
	if(!pc){
		var pcConfig = {
			'iceServers':[
				{
					'urls':'stun:turn.mostyour.com',
					'credential':'123456',
					'username':'webrtc',
				},
			],
		};
		
		pc = new RTCPeerConnection(pcConfig);
		
		pc.onicecandidate = (e) => {
			if(e.candidate){
				console.log("发现新的candidate", e.candidate)
				sendMessage(roomId, {
					type:'candidate', 
					label:e.candidate.sdpMLineIndex,
					id:e.candidate.sdpMid,
					candidate:e.candidate.candidate,
				});
				//sendMessage(e.candidate)
			}
		};
		
		pc.ontrack = (e) => {
			remoteVideo.srcObject = e.streams[0];
		}
	}
	
	if(pc === null || pc === undefined){
		console.error("pc is null or undefined ", pc);
		return;
	}
	
	if(localStream === null || localStream === undefined){
		console.error("localStream is null or undefined ", pc);
		return;
	}
	
	if(localStream){
		localStream.getTracks().forEach((track) => {
			pc.addTrack(track,localStream);
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

//5.连接信令服务器
function conn(){
	//var localUrl = "ws://10.0.11.71:8080";
	var lineUrl = "wss://webrtc.mostyour.com";
	socket = io.connect(lineUrl,{
	  autoConnect: true,
	  transports:['websocket'],
	});
	//////////////////////接收消息/////////////////////////
	//发送join请求加入房间后，服务器回复joined表示加入房间成功
	socket.on('joined', (message)=>{//7.服务器已经允许加入房间
		console.log('receive joined message: ', message);
		
		state = "joined";
		
		createPeerConnection();
		
		btnConn.disabled = true;
		btnLeave.disabled = false;
		
		console.log("receive joined message:state = ",state)
	});
	
	//表示第二个人也加入进来了
	socket.on('otherjoin', (message)=>{//9.服务器告知又一个人已经加入进来
		console.log('receive otherjoin message: ', message);
		
		if(state === 'joined_unbind'){
			createPeerConnection();
		}
		
		state="joined_conn";
		
		//媒体协商 //10.服务器告知又一个人已经加入进来 开始媒体协商
		call();
		console.log("receive otherjoin message:state=",state)
	});
	
	//发送join请求加入房间后，房间已经满了
	socket.on('full', (message)=>{//8.服务器已经不允许加入房间
		console.log('receive full message: ', message);
		
		state = "leaved";
		
		destoryPeerConnection();
		closeLocalMedia();
		//socket.disconnect();
		
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
	
	socket.on("disconnect", (socket)=>{
		if(state != "leaved"){
			destoryPeerConnection();
			closeLocalMedia();
		}
		state = "leaved";
	});
	
	//接收对方发送过来的消息
	socket.on('message', (message)=>{ //13.发给对方
		console.log('receive client message: ', message);
		//媒体协商 
		if(message.resource){
			console.log(message.resource);
			if(message.resource.type === "offer"){
				//message.resource就是SDP，但是是一个js对象或者说是一个文本并不是SDP对象需要转换
				pc.setRemoteDescription(new RTCSessionDescription(message.resource));
				pc.createAnswer()
					.then(getAnswer)
					.catch(handleAnswerError)
			}else if(message.resource.type === "answer"){
				bw.disabled = false;//接收到应答成功后可以开启控制速率的选项
				//同理
				pc.setRemoteDescription(new RTCSessionDescription(message.resource));
				
			}else if(message.resource.type === "candidate"){
				console.log(message.resource)
				var candidate = new RTCIceCandidate({
					sdpMLineIndex:message.resource.label,
					candidate:message.resource.candidate
				});
				pc.addIceCandidate(candidate);
			}else{
				console.error('Unknown message: ', message.resource)
			}
		}
	});
	
	///////////发送消息///////////////////
	//{errCode:200, roomId:"ROOM_高三1班_503", resource:null, Hint:"李敏请求加入房间"}
	socket.emit('join', {errCode:200, roomId:roomId, resource:1, hint:"李敏请求加入房间"}); //6.向服务器发送加入房间请求
	return;
}

//3.获取本地采集的视频
function getMediaStream(stream){
	localStream = stream;
	localVideo.srcObject=localStream;
	
	//4.连接信令服务器
	conn();
	
	//第三方统计绘图初始化
}

function handleError(err){
	console.error("navigator.mediaDevices.getUserMedia failed: ", err)
}

//3.开启本地视频
function start(){
	//采集桌面 无法同时采集音频
	//桌面是否可以调整分辨率
	//共享整个桌面/共享某个应用/共享某块区域 桌面和头像一起出来
//	if(!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia){
//		console.log("the getDisplayMedia is not supported!")
//	}
	
	//获取本地摄像头的流
	if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
		console.error("the getUserMedia is not supported!")
		return false;
	}
	
	else{
		var constraints = {
			video:{				
				width : 320,
				height : 200,
			},
			audio : true,
		};
		navigator.mediaDevices.getUserMedia(constraints)
		//navigator.mediaDevices.getDisplayMedia(constraints)
			.then(getMediaStream)
			.catch(handleError)
	}
}

//2.连接服务器
function connSignalServer(){
	//开启本地视频
	start();
	return true;	
}
//1.连接服务器
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
		socket.emit("leave", {errCode: 200, roomId:roomId,resource:1, hint:"请求离开房间"})
	}
	
	//释放资源
	destoryPeerConnection();
	closeLocalMedia();
	
	btnConn.disabled = false;
	btnLeave.disabled = true;
}

btnLeave.onclick = leave;


//控制速率
function changeBw(){
	bw.disabled = true;
	
	//拿到设置的速率
	var bw1 = bw.options[bw.selectedIndex].value;
	if(bw1 === "unlimited"){ //不限制就直接返回
		return;
	}
	
	var vsender = null;
	var senders = pc.getSenders();
	
	//找到视频的sender
	senders.forEach(sender => {
		if(sender && sender.track.kind === 'video'){
			vsender = sender;
		}
	});
	
	//获取视频的sender
	var parameters = vsender.getParameters();
	if(!parameters.encodings){
		return;
	}
	
	//处理一下数值
	parameters.encodings[0].maxBitrate = bw1 * 1000;
	
	//设置速率
	vsender.setParameters(parameters)
			.then(()=>{
				bw.disabled = false;
				console.log("Successed to set parameters!");
			})
			.catch(err => {
				console.error(err);
			})
	
	
}
bw.onchange = changeBw;


//统计信息
var lastResult; //上一次的统计信息

var timer = window.setInterval(()=>{
	var videoSender = null;
	var senders = pc.getSenders();
	//找到视频的sender
	senders.forEach(sender => {
		if(sender && sender.track.kind === 'video'){
			videoSender = sender;
		}
	});
	
	if(!videoSender){
		return;
	}
	
	videoSender.getStats()
			.then(reports => {
				reports.forEach(report => {
					if(report.type === 'outbound-rtp'){//发送的报告
						if(report.isRemote){//是远程发送的报告 忽略
							return;
						}
						//拿到本地发送的报告
						var currentTime = report.timestamp;
						var bytes = report.bytesSent;
						var packets = report.packetsSent;
						
						
						if(lastResult && lastResult.has(report.id)){
							var lastResultTime = lastResult.get(report.id).timestamp;
							var lastResultBytes = lastResult.get(report.id).bytesSent;
							var lastResultPackets = lastResult.get(report.id).packetsSent;
							
							var bitrate = 8 * (bytes-lastResultBytes) / (currentTime-lastResultTime);
							var pkts = packets - lastResultPackets;
							console.log(currentTime, bytes, pkts);
						}
					}
				});
				lastResult = reports;
			})
			.catch(err => {
				console.error(err);
			});
	
}, 1000);