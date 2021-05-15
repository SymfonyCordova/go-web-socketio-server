package controller

import (
	"html/template"
	"net/http"
)

type DP2PController struct {
}

var P2PController DP2PController

func doP2PGet(response http.ResponseWriter, request *http.Request) {
	tmpl := template.Must(template.ParseFiles("view/p2p.html"))
	tmpl.Execute(response, nil)
}

func doP2PPost(response http.ResponseWriter, request *http.Request) {
	doP2PGet(response, request)
}

func (c *DP2PController) P2P(response http.ResponseWriter, request *http.Request) {
	request.ParseForm()
	method := request.Method

	if "GET" == method {
		doP2PGet(response, request)
	} else if "POST" == method {
		doP2PPost(response, request)
	} else {
		http.NotFound(response, request)
	}
}
