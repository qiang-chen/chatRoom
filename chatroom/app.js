const express = require("express");
const path = require("path")
const app = express();
let users = [];
//挂载加载静态资源中间件
app.use(express.static(path.join(__dirname, "public")));
const server = app.listen(8000, () => {
    console.log("port is 8000")
});

//启用socket.io
const io = require("socket.io")(server);

io.on("connection", (socket) => {
    console.log("用户加入了");
    //接受用户名和头像
    socket.on("login", data => {
        console.log(data.username + "登录");
        //判断这个账号是不是登录成功 就是看看有没有重名的进来
        //声明一个空数组判断
        let flag = users.find(item => item.username == data.username);
        if (flag) {
            socket.emit("loginResult", {
                code: 0,
                msg: "登录失败"
            })
        } else {
            //往数组存一波
            users.push(data)
            socket.emit("loginResult", {
                code: 1,
                msg: data
            });

            //然后我们的广播还要提示所有人有人加入了聊天室
            io.emit("addUser", data);

            //每次登陆成功后给我们所有人返回一波人数数组

            io.emit("userList", users)
            // 将用户给保存起来
            console.log(data.username, "每次绑定的是谁")
            //每一个用户都有一个socket 每次断开就会触发自己socket 这个不是唯一的
            socket.username = data.username
            socket.headPhoto = data.headPhoto
        }
    })

    //再来一波断开连接 也就是离开聊天室请求
    socket.on("disconnect", () => {
        //告诉所有人有人离开了
        //需要在上面登录的时候绑定一下每个人
        //也就是将所有人存储到socket上
        console.log(socket.username + "离开了")
        io.emit('delUser', {
            username: socket.username,
            headPhoto: socket.headPhoto
        })
        //然后从数组中把这个人删除了在运行一下userList告诉所有人
        let idx = users.findIndex(item => item.username === socket.username)
        users.splice(idx, 1)
        io.emit('userList', users)
    })

    //接受一下聊天按钮发送过来的信息 然后转发给所有人
    socket.on("chat", data => {
        // 直接广播给所有人
        io.emit('allUser', data)
    })

    //接受点击图片发送过来的图片然后广播给所有用户
    socket.on('sendImage', data => {
        // 直接广播给所有人
        io.emit('allImage', data)
      })

})