'use strict'

var username = document.querySelector('input#username');
var inputRoom = document.querySelector('input#room');
var btnConnect = document.querySelector('button#connect');
var btnSend = document.querySelector('button#send');
var outputArea = document.querySelector('textarea#output');
var inputArea = document.querySelector('textarea#input');

var socket = io("ws://127.0.0.1:8080",{
	  autoConnect: false,
	  transports:['websocket'],
});

var room;

socket.on("connect",function(){
	alert("连接成功");
	console.log("连接成功");
});

socket.on("disconnect", ()=>{
	alert("断开连接");
	socket.disconnect();
	socket = null;
	//其他逻辑
});

//离开房间
//socket.on('leave', (message) => {
//	btnConnect.disabled = false;
//	inputArea.disabled = true;
//	btnSend.disabled = true;
//});


//消息
//socket.on('message', (room, id, data) =>{
//	outputArea.value = outputArea.value + data + "\r";
//});

btnConnect.onclick = () => {
	//连接服务器
	socket.connect();
	//该业务连接后直接加入到房间
	//send message 连接加入房间 获取房间名 加入该房间
	room = inputRoom.value;
	socket.emit("join", {id:1, channel:room, text:"wo lai le"}, function(result){
		console.log("send success");
		console.log(result);
	});
};

//接收服务器join 加入房间的事件
socket.on("join",(message) => {
	btnConnect.disabled = true;
	inputArea.disabled = false;
	btnSend.disabled = false;
});

btnSend.onclick = () => {
	var data = inputArea.value;
	data = username.value + ":" + data;
	socket.emit('message', room, data);
	inputArea.value = '';
};