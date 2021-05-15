package controller

import (
	"html/template"
	"net/http"
)

type DIndexController struct {
}

var IndexController DIndexController

func (c *DIndexController) Devices(response http.ResponseWriter, request *http.Request) {
	request.ParseForm()
	method := request.Method

	if "GET" == method {
		tmpl := template.Must(template.ParseFiles("view/devices.html"))
		tmpl.Execute(response, nil)
	} else if "POST" == method {
		http.NotFound(response, request)
	} else {
		http.NotFound(response, request)
	}
}

func (c *DIndexController) AudioVideo(response http.ResponseWriter, request *http.Request) {
	method := request.Method
	if "GET" == method {
		tpl, _ := template.ParseFiles("view/audio_video.html")
		response.Header().Set("Expires", "-1")
		response.Header().Set("Cache-Controller", "no-cache")
		response.Header().Set("Pragma", "no-cache")
		response.WriteHeader(200)
		tpl.Execute(response, nil)
	} else {
		http.NotFound(response, request)
	}
}
