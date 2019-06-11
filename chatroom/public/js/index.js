
//连接服务
const socket = io('http://169.254.12.134:8000');

let curUser, curHead;

//点击头像给他们添加绿色的小框框

$("#login_avatar li").click(function () {
  $(this).addClass("now").siblings().removeClass("now")
})

//点击页面将用户名和头像发送给后台

$("#loginBtn").click(() => {
  let username = $("#username").val().trim();
  let headPhoto = $("#login_avatar .now img").attr("src")
  //将获取到的用户名和账号发送到后台
  if (username) {
    socket.emit("login", {
      username,
      headPhoto
    })
  } else {
    alert("请输入正确的姓名")
  }
})

//接受一波登录结果判断

socket.on("loginResult", data => {
  if (data.code === 0) {
    alert("登录失败,该账号已有人进入")
  } else {
    //登录成功 让其登录页面消失 聊天页面显示
    $(".login_box").fadeOut();
    $(".container").fadeIn();

    //进入聊天页面以后默认显示用户信息
    console.log(data.msg)
    $(".header .avatar .img").attr("src", data.msg.headPhoto);
    $(".header .info .username").text(data.msg.username);
    curUser = data.msg.username;
    curHead = data.msg.headPhoto;
  }
});

//监听一波所有人加入聊天室
socket.on("addUser", data => {
  //再来一波系统默认提示功能
  $(".box-bd").append(`<div class="system">
  <p class="message_system">
    <span class="content">${data.username}加入了群聊</span>
  </p>
</div>`);
  scroll()
});

//监听一下聊天室总共多少人以及左边列表
socket.on("userList", data => {
  //console.log(data)
  $('.user-list ul.ll').html(" ");
  data.forEach(item => {
    $('.user-list ul.ll').append(`
       <li class="user">
          <div class="avatar"><img src="${item.headPhoto}" alt="" /></div>
          <div class="name">${item.username}</div>
        </li>
    `)
  });
  // 修改群聊人数
  $('.box-hd span').text(data.length);
});

//监听一下有人离开

socket.on("delUser", data => {
  //再来一波系统默认提示功能
  $(".box-bd").append(`<div class="system">
  <p class="message_system">
    <span class="content">${data.username}离开了群聊</span>
  </p>
</div>`);
  scroll()
});


//点击确定按钮向服务器发送我们聊天内容
$("#btn-send").click(() => {
  //首先获取聊天的内容
  let content = $('#content').html()
  $('#content').html('');

  //我们给服务器发送过去聊天的内容还有头像姓名
  //所以我们需要声明一个全局变量在登录的时候保存一下
  if (content) {
    socket.emit("chat", {
      content, curUser, curHead
    })
  }
})

//按下回车也可以发送消息
$("#content").on("keydown", (e) => {
  if (e.keyCode === 13) {
    //首先获取聊天的内容
    let content = $('#content').html()
    $('#content').html('');

    //我们给服务器发送过去聊天的内容还有头像姓名
    //所以我们需要声明一个全局变量在登录的时候保存一下
    if (content) {
      socket.emit("chat", {
        content, curUser, curHead
      })
    }
  }
})



//监听一波我们所有人发送的消息
socket.on("allUser", data => {
  //console.log(data);
  //通过前面我们保存的用户名判断是自己发的消息还是别人发的消息 然后分别渲染到页面上去
  if (data.curUser === curUser) {
    //自己的消息
    $('.box-bd').append(`
      <div class="message-box">
        <div class="my message">
          <img class="avatar" src="${data.curHead}" alt="" />
          <div class="content">
            <div class="bubble">
              <div class="bubble_cont">${data.content}</div>
            </div>
          </div>
        </div>
      </div>
    `)
  } else {
    //别人的消息
    $('.box-bd').append(`
    <div class="message-box">
      <div class="other message">
        <img class="avatar" src="${data.curHead}" alt="" />
        <div class="content">
          <div class="nickname">${data.curUser}</div>
          <div class="bubble">
            <div class="bubble_cont">${data.content}</div>
          </div>
        </div>
      </div>
    </div>    
  `)
  }
  scroll()
});

//封装一个函数让其最后一个元素自动滚动到可视区最底部
function scroll() {
  $('.box-bd').children(":last").get(0).scrollIntoView(false);//false是滚到最底部 true是最顶部
}


//点击发送一波图片操作
//这里利用我们input框的属性为file打开文件的操作
$('#file').on('change', function () {
  // 获取到该图片
  console.log(this.files)
  var file = this.files[0];//这样能取到我们选择的图片
  var fr = new FileReader();//读取上传的文件
  fr.readAsDataURL(file);//将这个文件读取成一个编码
  fr.onload = function () {
    //读取结束后发送给服务器
    socket.emit('sendImage', {
      curUser,
      curHead,
      img: fr.result//读取的结果
    })
  }
})


//接受服务器发送过来的图片信息

socket.on("allImage", data => {
  console.log(data);
  //通过前面我们保存的用户名判断是自己发的消息还是别人发的消息 然后分别渲染到页面上去
  if (data.curUser === curUser) {
    //自己的消息
    $('.box-bd').append(`
      <div class="message-box">
        <div class="my message">
          <img class="avatar" src="${data.curHead}" alt="" />
          <div class="content">
            <div class="bubble">
              <div class="bubble_cont"><img src="${data.img}"></div>
            </div>
          </div>
        </div>
      </div>
    `)
  } else {
    //别人的消息
    $('.box-bd').append(`
    <div class="message-box">
      <div class="other message">
        <img class="avatar" src="${data.curHead}" alt="" />
        <div class="content">
          <div class="nickname">${data.curUser}</div>
          <div class="bubble">
            <div class="bubble_cont"><img src="${data.img}"></div>
          </div>
        </div>
      </div>
    </div>    
  `)
  }
  // 滚动到底部
  $('.box-bd img:last').load(function () {
    //当最后一张图片加载完毕后让其滚动到最下面
    scroll()
  })

});

// 表情功能
$('.face').on('click', function () {
  //一定要注意要在时间里面初始化这个jQuery插件
  $('#content').emoji({
    button: '.face',//设置点击出来表情的元素
    position: 'topRight',//动画
    showTab: true,//当有一列的是否出现tap效果
    animation: 'fade',//动画
    icons: [
      //选择配置的地址
      {
        name: 'qq表情',
        path: '../lib/jquery-emoji/img/qq/',
        maxNum: 91,
        excludeNums: [41, 45, 54],
        file: '.gif',
        placeholder: '#qq_{alias}#'
      }
    ]
  })
})