'use strict'

var localVideo = document.querySelector('video#localvideo');
var remoteVideo = document.querySelector('video#remotevideo');

var btnStart = document.querySelector('button#start');
var btnCall = document.querySelector('button#call');
var btnHungup = document.querySelector('button#hungup');

var offer = document.querySelector('textarea#offer');
var answer = document.querySelector('textarea#answer');

var localStream;
var pc1;
var pc2;

btnStart.onclick = start;
btnCall.onclick = call;
btnHungup.onclick = hungup;

function start(){
	if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
		console.log("getUserMedia is not supported!")
	}else{
		var constraints = {
			video:{
				width : 320,
				height : 200,
			},
			audio : false,
		};
		navigator.mediaDevices.getUserMedia(constraints)
			.then(gotMediaStream)
			.catch(handleError);	
	}
}

//本机内1对1互通2
function call(){
	pc1 = new RTCPeerConnection();
	pc2 = new RTCPeerConnection();
	
	//初始化双方的事件
	pc1.onicecandidate = (e) => {
		pc2.addIceCandidate(e.candidate);
	};
	
	pc2.onicecandidate = (e) => {
		pc1.addIceCandidate(e.candidate);
	};
	
	//接收方 收到流事件
	pc2.ontrack = getRemoteStream;
	
	//先添加流数据,再媒体协商 这个步骤不能乱
	//1.添加流数据
	localStream.getTracks().forEach((track) => {//发送方遍历采集到的轨
		pc1.addTrack(track, localStream);//加入到pc1中
	});
	//2.媒体协商
	var offerOptions = {
		offerToReceiveAudio:0,//没有音频
		offerToReceiveVideo:1, //有视频
	};
	pc1.createOffer(offerOptions)
		.then(getOffer)//成功创建处理函数
		.catch(handleOfferError);
}

function hungup(){
	pc1.close();
	pc2.close();
	pc1 = null;
	pc2 = null;
}

//stream传入的流
function gotMediaStream(stream){
	localVideo.srcObject = stream;
	localStream = stream;
}

//接收方 收到流事件处理
function getRemoteStream(conn){//接收方能接收到多个流
	remoteVideo.srcObject = conn.streams[0];
}

function getOffer(desc){
	pc1.setLocalDescription(desc); 
	offer.value = desc.sdp;
	//send desc to signal 发送到信令服务器
	//receive desc from signal 接收信令服务器传递对方的信息
	
	
	pc2.setRemoteDescription(desc);
	
	pc2.createAnswer()
		.then(getAnswer)
		.catch(handleAnswerError);
}

function handleOfferError(e){
	handleError(e);
	console.log("Falied create offer");
}


function getAnswer(desc){
	pc2.setLocalDescription(desc);
	answer.value = desc.sdp;
	
	//send desc to signal 发送到信令服务器
	//receive desc from signal 接收信令服务器传递对方的信息
	
	pc1.setRemoteDescription(desc);
}

function handleAnswerError(e){
	handleError(e);
	console.log("Falied create answer");
}


function handleError(err){
	console.log(err.name + ": "+ err.message);	
}