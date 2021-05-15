package controller

import (
	"html/template"
	"net/http"
)

type DChatRoomController struct {
}

var ChatRoomController DChatRoomController

func doChatRoomGet(response http.ResponseWriter, request *http.Request) {
	tmpl := template.Must(template.ParseFiles("view/chat_room.html"))
	tmpl.Execute(response, nil)
}

func doChatRoomPost(response http.ResponseWriter, request *http.Request) {
	doChatRoomGet(response, request)
}

func (c *DChatRoomController) ChatRoom(response http.ResponseWriter, request *http.Request) {
	request.ParseForm()
	method := request.Method

	if "GET" == method {
		doChatRoomGet(response, request)
	} else if "POST" == method {
		doChatRoomPost(response, request)
	} else {
		http.NotFound(response, request)
	}
}
