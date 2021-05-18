package main

import (
	"go-web-server/controller"
	"go-web-server/socketio"
	"log"
	"net/http"
)

func main() {
	serveMux := http.NewServeMux()
	//加载静态文件
	serveMux.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))
	//p2p
	serveMux.HandleFunc("/p2p", controller.P2PController.P2P)

	serveMux.Handle("/socket.io/", socketio.Server)

	log.Println("Starting server...")
	//log.Panic(http.ListenAndServe(":8080", serveMux))
	log.Panic(http.ListenAndServeTLS(":443", "cert/webrtc.mostyour.com.pem", "cert/webrtc.mostyour.com.key", serveMux))
}

//直播客户端的实现2
