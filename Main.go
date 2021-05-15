package main

import (
	"go-web-server/controller"
	"log"
	"net/http"
)

func main() {
	serveMux := http.NewServeMux()
	//加载静态文件
	serveMux.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))
	//获取视频信息
	serveMux.HandleFunc("/devices", controller.IndexController.Devices)
	//采集音频和视频
	serveMux.HandleFunc("/audioVideo", controller.IndexController.AudioVideo)
	//聊天室
	serveMux.HandleFunc("/chatroom", controller.ChatRoomController.ChatRoom)
	//p2p
	serveMux.HandleFunc("/p2p", controller.P2PController.P2P)

	log.Println("Starting server...")
	log.Panic(http.ListenAndServeTLS(":443", "cert/webrtc.mostyour.com.pem", "cert/webrtc.mostyour.com.key", serveMux))
}
