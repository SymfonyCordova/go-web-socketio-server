'use strict'

//获取设备
function getDevices(){
	if(!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices){
		console.log("enumerateDevices is not supported!")
	}else{
		navigator.mediaDevices.enumerateDevices()
			.then(gotDevices)
			.catch(handleError);	
	}
}

//音频采集API
function getUserMedia(){
	if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
		console.log("getUserMedia is not supported!")
	}else{
/*
		var constraints = {
			video : true, //是否采集视频
			audio : true //是否采集音频
		};
		var constraints = {
			video : {
				width : 640,
				height : 30,
				frameRate: 30,
				facingMode: "user"
			},
			audio : false //是否采集音频
		};

		var constraints = {
			video : {
				width : {
					min:300,
					max:640,
				},
				height : {
					min:300,
					max:640,
				},
				frameRate:{
					min:15,
					max:30,
				},
			},
			audio : {
				noiseSuppression:true,
				echoCancellation: true,
			},
		};
	
		var constraints = {
			video:false,
			audio : {
				noiseSuppression:true,
				echoCancellation: true,
			},
		};
*/
		var constraints = {
			video:true,
			audio : {
				noiseSuppression:true,
				echoCancellation: true,
			},
		};
		navigator.mediaDevices.getUserMedia(constraints)
			.then(gotMediaStream)
			.then(gotDevices)
			.catch(handleError);	
	}
}

//filter
function setFilter(){
	var filter = document.querySelector("select#filter");
	var player = document.querySelector("video#player");
	filter.onchange=function(){
		player.className = filter.value;
	}
}

//从video中获取图片
function setImageFromVideo(){
	var snapshot = document.querySelector("button#snapshot");
	var picture = document.querySelector("canvas#picture");
	picture.width = 640;
	picture.height = 480;
	
	var player = document.querySelector("video#player");
	var filter = document.querySelector("select#filter");
	snapshot.onclick = function(){
		picture.className = filter.value; //也可以设置滤镜
		picture.getContext('2d').drawImage(player,0,0,picture.width,picture.height);
	}
}

var buffer;
var mediaRecorder;
//播放录制的视频
function playRecvVideo(){
	//播放录制的视频播放器
	var recvPlayer = document.querySelector("video#recvPlayer");
	//开始录制
	var btnRecord = document.querySelector("button#record");
	//播放录制的视频
	var btnPlay = document.querySelector("button#recvplay");
	//下载录制的视频播放器
	var btnDownload = document.querySelector("button#download");
	
	btnRecord.onclick = () => {
		if(btnRecord.textContent === "start record"){
			startRecord();
			btnRecord.textContent = "stop record";
			btnPlay.disabled = true;
			btnDownload.disabled = true;
		}else{
			stopRecord();
			btnRecord.textContent = "start record";
			btnPlay.disabled = false;
			btnDownload.disabled = false;
		}
	}
	
	btnPlay.onclick = () => {
		var blob = new Blob(buffer, {type:'video/webm'});
		recvPlayer.src = window.URL.createObjectURL(blob);
		recvPlayer.srcObject = null;
		recvPlayer.controls = true;
		recvPlayer.play();
	}
	
	btnDownload.onclick = () => {
		var blob = new Blob(buffer, {type:'video/webm'});
		var url = window.URL.createObjectURL(blob);
		var a = document.createElement('a');
		
		a.href = url;
		a.style.display = 'none';
		a.download = "aaa.webm";
		a.click();
	}
}

function startRecord(){
	buffer = [];	//二进制数组
	var options = {
		mimeType: 'video/webm;codecs=vp8'	,
	};
	
	if(!MediaRecorder.isTypeSupported(options.mimeType)){
		console.error(options.mimeType + " is not supported")
		return ;
	}
	
	try{
		mediaRecorder = new MediaRecorder(window.stream,options);
	}catch(e){
		console.error("Failed to create MediaRecoder:", e)
		return ;
	}
	
	mediaRecorder.ondataavailable = handleDataAvailable;
	mediaRecorder.start(10);
	
}
function handleDataAvailable(e){
	if(e && e.data && e.data.size > 0){
		buffer.push(e.data);
	}
}
function stopRecord(){
	mediaRecorder.stop();
}



//stream传入的流
function gotMediaStream(stream){
	var player = document.querySelector("video#player");
	player.srcObject = stream;
	window.stream = stream;
	
	//只获取音频
	//var audioPlayer = document.querySelector("audio#audioPlayer");
	//audioPlayer.srcObject = stream;
	
	//获取当前流的视频流
	var videoTrack = stream.getVideoTracks()[0]
	var videoConstraints = videoTrack.getSettings();//拿到流的参数
	var divcons = document.querySelector("div#constraints");
	divcons.textContent = JSON.stringify(videoConstraints, null, 2);//转换成json
	
	return navigator.mediaDevices.enumerateDevices();
}

function gotDevices(deviceInfos){
	console.log("gotDevices")
	var audioInputSource = document.querySelector("select#audioInputSource");
	var audioOutputSource = document.querySelector("select#audioOutputSource");
	var videoInputSource = document.querySelector("select#videoInputSource");
	deviceInfos.forEach(function(deviceInfo){	
		
		console.log(deviceInfo.kind+": label = "
						+ deviceInfo.label+": id = "
						+ deviceInfo.deviceId+": groupId = "
						+ deviceInfo.groupId);
		
		var option = document.createElement('option');

		option.text = deviceInfo.groupId;
		option.value = deviceInfo.groupId;
		if(deviceInfo.kind ==='audioinput'){
			audioInputSource.appendChild(option);
		}else if(deviceInfo.kind === 'audiooutput'){
			audioOutputSource.appendChild(option);
		}else if(deviceInfo.kind === 'videoinput'){
			videoInputSource.appendChild(option);
		}
	});
}

function handleError(err){
	console.log(err.name + ": "+ err.message);	
}
