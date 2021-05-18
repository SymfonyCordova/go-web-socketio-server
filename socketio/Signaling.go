package socketio

import (
	"log"

	"github.com/graarh/golang-socketio"
	"github.com/graarh/golang-socketio/transport"
)

//{errCode:200, roomId:"ROOM_高三1班_503", resource:null, Hint:"李敏请求加入房间"}
type Message struct {
	ErrCode  int         `json:"errCode"`
	RoomId   string      `json:"roomId"`
	Resource interface{} `json:"resource"`
	Hint     string      `json:"hint"`
}

var LIMIT_USER_COUNT = 3 //限制用户数量

//socketio
var Server *gosocketio.Server

func init() {
	Server = gosocketio.NewServer(transport.GetDefaultWebsocketTransport())
	//客户端连接进来
	Server.On(gosocketio.OnConnection, func(c *gosocketio.Channel) { //c代表每个客户端
		log.Println("new client connected ip: ", c.Ip())
	})
	//发生错误
	Server.On(gosocketio.OnError, func(c *gosocketio.Channel) {
		log.Println("error occurs")
	})

	//客户端发送加入房间请求
	Server.On("join", func(c *gosocketio.Channel, message Message) string {
		log.Println(message)
		//房间名字
		room := message.RoomId

		//一开始将用户加入到房间 用户选择了一个要加入的房间
		c.Join(room) //必须先加进来，因为一开始房间是空的 只有先加进来才能拿到房间的信息 否则无法计算出人数

		//获取房间内的所有的客户端
		channels := c.List(room)
		//当前的客户端数量
		currentUserCount := len(channels)
		if currentUserCount < LIMIT_USER_COUNT { //房间满了

			//给当前的客户端发送消息 joined一定是代表加进来了
			c.Emit("joined", Message{200, room, c.Id(), "亲加入成功了！"})

			if currentUserCount > 1 { //说明是第二个人来了
				//给这个房间所有的人发送的消息 除了自己
				sendExceptSender(room, "otherjoin", c, Message{200, room, c.Id(), "有另一哥们加入房间了！"})
			}
		} else {
			//房间满了 将这个人踢出房间
			c.Leave(room)
			//告诉当前客户端已经满了
			c.Emit("full", Message{500, room, c.Id(), "房间已经满了"})
		}
		return "OK"
	})

	//自定义一个离开房间的消息监听
	Server.On("leave", func(c *gosocketio.Channel, message Message) string {
		//房间名字
		room := message.RoomId
		//给这个房间所有的人发送的消息 除了自己
		sendExceptSender(room, "bye", c, Message{200, room, c.Id(), "亲再见，下次聊！！！"})
		//给当前客户端发消息
		c.Emit("leaved", Message{200, room, c.Id(), "允许离开成功!"})
		return "OK"
	})

	Server.On("message", func(c *gosocketio.Channel, message Message) string {
		//房间名字
		room := message.RoomId
		//给这个房间所有的人发送的消息
		sendExceptSender(room, "message", c, message) //消息不做任何处理直接转发过去
		return "OK"
	})
}

//发给除自己的其他人
func sendExceptSender(room string, event string, c *gosocketio.Channel, message interface{}) {
	cs := c.List(room)

	for _, ic := range cs {
		if ic.Id() == c.Id() {
			continue
		}
		ic.Emit(event, message)
	}
}
