function writeObj(obj) {
    var description = "";
    for (var i in obj) {
        var property = obj[i];
        description += i + " = " + property + "\n";
    }
    alert(description);
}
const jsonParse = function(data) {
  try {
    data = JSON.parse(data);
  } catch (error) {
    data = {};
  }

  return data;
};
(function () {
  var INIT = 0 //默认初始状态，按钮显示【下载】
  var DOWNLOADING = 1 //下载中，按钮显示【暂停】并展示【进度】
  var PREPARE_DOWNLOADING = 8
  var PAUSED = 2 //暂停，按钮显示【继续】
  var RESUMED = 3 //继续，按钮显示【暂停】并展示【进度】
  var DOWNLOADED = 4 //下载完成，按钮显示【安装】
  var CANCELED = 5 // 取消下载
  var INSTALLING = 6 //安装中，按钮显示【安装中】
  var INSTALLED = 7 // 安装完成，按钮显示【打开】
  var START = 9
  var statusCache = {}

  if (window.oppoDownload) {
	    //Android ---> JS  返回字符串(url,pkg)，状态，进度数
	    oppoDownload['sync'] = function (json, state, progress) {
	      var data = null
	      try {
	        data = JSON.parse(json)
	      } catch (e) {
	        data = {}
	      }
	      var pkg = data.pkg || ''
	
	      progress = ((progress || 0) * 1).toFixed(1) + '%'
	
	      switch (parseInt(state, 10)) {
	        case INIT:
	          statusCache[pkg] = INIT
	          JsBridgeAndroid.showStatus(pkg, '下载', INIT, progress);
	          break;
	        case PREPARE_DOWNLOADING:
	        case DOWNLOADING:
	          statusCache[pkg] = DOWNLOADING
	          JsBridgeAndroid.showStatus(pkg, '暂停', DOWNLOADING, progress);
	          break;
	        case START:
	          JsBridgeAndroid.startCallback(pkg, START)
	          JsBridgeAndroid.showStatus(pkg, '暂停', DOWNLOADING, progress);
	          break;
	        case PAUSED:
	          JsBridgeAndroid.showStatus(pkg, '继续', PAUSED, progress);
	          break;
	        case RESUMED:
	          JsBridgeAndroid.showStatus(pkg, '暂停', RESUMED, progress);
	          break;
	        case DOWNLOADED:
	          progress = '100%'
	          statusCache[pkg] = DOWNLOADED
	          JsBridgeAndroid.showStatus(pkg, '安装', DOWNLOADED, progress);
	          break;
	        case CANCELED:
	          statusCache[pkg] = INIT
	          JsBridgeAndroid.showStatus(pkg, '下载', CANCELED, progress);
	          break;
	        case INSTALLING:
	          progress = '100%'
	          statusCache[pkg] = INSTALLING
	          JsBridgeAndroid.showStatus(pkg, '安装中', INSTALLING, progress);
	          break;
	        case INSTALLED:
	          progress = '100%'
	          statusCache[pkg] = INSTALLED
	          JsBridgeAndroid.showStatus(pkg, '打开', INSTALLED, progress);
	          break;
	      }
	    }
   }
  //浏览器下载APP，JS与Android通信对象
  window.JsBridgeAndroid = {
		    download: function (opt) {
		      //JS ---> Android（商店内资源||第三方资源） 通知浏览器开始下载任务
		      window.parent.oppoDownload && window.parent.oppoDownload.download(opt)
		    },
		    paused: function (opt) {
		      //JS ---> Android  暂停
		      oppoDownload && oppoDownload.onSync(opt, PAUSED)
		    },
		    resumed: function (opt) {
		      //JS ---> Android  重新下载
		      oppoDownload && oppoDownload.onSync(opt, RESUMED)
		    },
		    installing: function (opt) {
		      //JS ---> Android  安装
		      oppoDownload && oppoDownload.onSync(opt, INSTALLING)
		    },
		    open: function (opt) {
		      //JS ---> Android  打开
		      oppoDownload && oppoDownload.onSync(opt, INSTALLED)
		    },
		    //pkg包名，url第三方下载URL，deeplink点击打开后跳转
		    doActionForClick: function (opt) {
		      var optStr = null
		      var pkg = opt.pkg
		      var url = opt.url
		      var deeplink = opt.deeplink
		      if (!pkg) {
		        return
		      }
		
		      if (!window.parent.oppoDownload) {
		        if (!url) {
		          window.location.href ="market://details?id="+pkg+"&caller=com.android.browser&token=9bf42917ec59b8a1";
		        }
		        return
		      }
		      try {
		        optStr = JSON.stringify(opt)
		      } catch (e) {
		        optStr = ''
		      }
		      //var status = statusCache[pkg] || INIT
		      var status = 8
		      switch (status) {
		        case INIT:
		        case PREPARE_DOWNLOADING:
		          if (url) {
		            this.download(optStr);
					var string = "1"
		            common.toast(string)
		          } else {
		            if (window.parent.oppoDownload.supportMarkDownload()) {
		              this.download(optStr);
					  var string = "<p>你正在下载安装多个应用，你看下你自己的下载管理</p><p>等下就安装好。。。。</p>"
		              common.toast(string)
		            } else {
		              window.location.href ="market://details?id="+pkg+"&caller=com.android.browser&token=9bf42917ec59b8a1";
		            }
		          }
		          statusCache[pkg] = PREPARE_DOWNLOADING
		          break;
		        case DOWNLOADING:
		          // this.paused(optStr)
		          common.toast("<p>正在下载中，</p><p>安装完成后可点击打开</p>")
		          // statusCache[pkg] = PAUSED
		          break;
		        case PAUSED:
		          this.resumed(optStr)
		          common.toast("下载中")
		          statusCache[pkg] = RESUMED
		          break;
		        case RESUMED:
		          // this.paused(optStr)
		          // statusCache[pkg] = PAUSED
		          break;
		        case DOWNLOADED:
		          this.installing(optStr)
		          // statusCache[pkg] = INSTALLING
		          break;
		        case INSTALLING:
		          common.toast("<p>已下载完成，</p><p>正在安装中</p>")
		          break;
		        case INSTALLED:
		          if (deeplink) {
		            this.openDeepLink(deeplink)
		          } else {
		            this.open(optStr)
		          }
		          break;
		      }
		    },
		    //判断APP 初始状态
		    getInitState: function (opt) {
		      var params = []
		      var stateMap = {}
		
		      if (!window.oppoDownload) {
		        return stateMap
		      }
		
		      if (Object.prototype.toString.call(opt) !== '[object Array]') {
		        opt = [opt]
		      }
		
		      for (var i = 0; i < opt.length; ++i) {
		        opt[i].pkg && params.push(opt[i])
		      }
		
		      try {
		        params = JSON.parse(oppoDownload.queryDownloadState(JSON.stringify(params)))
		      } catch (e) {
		        params = []
		      }
		
		      for (var i = 0; i < params.length; ++i) {
		
		        var initState = params[i] || {}
		        var pkg = initState.pkg
		        if (pkg) {
		          stateMap[pkg] = {}
		          if (initState.progress) {
		            stateMap[pkg]['progress'] = (initState.progress * 1).toFixed(1) + '%'
		          }
		
		          switch (parseInt(initState.status, 10)) {
		            case INIT:
		              statusCache[pkg] = INIT;
		              stateMap[pkg]['status'] = INIT;
		              stateMap[pkg]['txt'] = '下载';
		              break;
		            case DOWNLOADING:
		              common.toast("<p>正在下载中，</p><p>安装完成后可点击打开</p>")
		              statusCache[pkg] = DOWNLOADING;
		              stateMap[pkg]['status'] = DOWNLOADING;
		              stateMap[pkg]['txt'] = '暂停';
		              break;
		            case PAUSED:
		              common.toast("下载已暂停，点击继续下载")
		              statusCache[pkg] = PAUSED;
		              stateMap[pkg]['status'] = PAUSED;
		              stateMap[pkg]['txt'] = '继续';
		              break;
		            case RESUMED:
		              statusCache[pkg] = RESUMED;
		              stateMap[pkg]['status'] = RESUMED;
		              stateMap[pkg]['txt'] = '暂停';
		              break;
		            case DOWNLOADED:
		              statusCache[pkg] = DOWNLOADED;
		              stateMap[pkg]['status'] = DOWNLOADED;
		              stateMap[pkg]['txt'] = '安装';
		              break;
		            case CANCELED:
		              statusCache[pkg] = INIT;
		              stateMap[pkg]['status'] = INIT;
		              instateMap[pkg]['txt'] = '下载';
		              break;
		            case INSTALLING:
		              common.toast("<p>已下载完成，</p><p>正在安装中</p>")
		              statusCache[pkg] = INSTALLING;
		              stateMap[pkg]['status'] = INSTALLING;
		              stateMap[pkg]['txt'] = '安装中';
		              break;
		            case INSTALLED:
		              common.toast("<p>已安装完成，</p><p>点击可直接打开</p>");
		              statusCache[pkg] = INSTALLED;
		              stateMap[pkg]['status'] = INSTALLED;
		              stateMap[pkg]['txt'] = '打开';
		              break;
		            default:
		              statusCache[pkg] = INIT;
		              stateMap[pkg]['status'] = INIT;
		              stateMap[pkg]['txt'] = '下载';
		              break;
		          }
		        }
		      }
		      return stateMap
		    },
		    openDeepLink: function (deeplink) {
		      var ifr = document.createElement('iframe')
		      ifr.src = deeplink
		      ifr.style.display = 'none'
		      document.body.appendChild(ifr)
		      window.setTimeout(function () {
		        document.body.removeChild(ifr)
		      }, 300)
		    },
		    /*
		     *  业务自定义通过package获取按钮和进度条DOM
		     *  pkg 包名
		     *  txt 显示按钮名称
		     *  status 当前状态
		     *  progress 进度
		     */
		    showStatus: function (pkg, txt, status, progress) {},
		    startCallback: function (pkg, status) {} //开始下载后的回调函数
		  }
})()

var common = {
		  //通过url获取参数name的值
		  getParam: function (name, url) {
		    var u = arguments[1] || window.location.search
		    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)")
		    var r = u.substr(u.indexOf("\?") + 1).match(reg)
		    return r != null ? r[2] : ""
		  },
		  //获取网络环境
		  getNetType: function () {
		    try {
		      return navigator.connection.type
		    } catch (err) {
		      return '';
		    }
		  },
		  //获取android版本号
		  getAndVer: function () {
		    var ua = navigator.userAgent.toLowerCase();
		    var match = ua.match(/android\s([0-9\.]*)/);
		    return match ? match[1] : '';
		  },
		  //获取浏览器版本号
		  getAppVer: function () {
		    var ua = navigator.userAgent;
		    if (ua.indexOf("OppoBrowser/") != '-1') {
		      return ua.substr(ua.indexOf("OppoBrowser/") + 12);
		
		    } else {
		      return '';
		    }
		  },
		  //检查浏览器是否支持webp
		  checkWebpSupport: function () {
		    var canvas = document.createElement('canvas');
		    if (Boolean(canvas.getContext && canvas.getContext('2d'))) {
		      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
		    }
		    return false;
		  },
		  addDebug: function (callback) {
		    var script = document.createElement('script');
		    script.src = 'https://data.ads.oppomobile.com/h5/debug.min.js?v=20171110';
		    document.body.appendChild(script);
		    script.onload = function () {
		      eruda && eruda.init();
		      callback && callback();
		    }
		  },
		  //添加统计脚本
		  addScript: function () {
		    var hostName = window.location.hostname;
		    //var staticHost = hostName === "adsfs.oppomobile.com" ? "https://data.ads.oppomobile.com" : "https://dev.e.oppomobile.com";
		    var staticHost = "https://data.ads.oppomobile.com";
		    var script = document.createElement("script");
		    script.src = staticHost + "/h5/statistics-v2.js?v=" + common.getTail();
		    document.body.appendChild(script);
		  },
		
		
		  getTail: function () {
		    var now = new Date();
		    var hour = now.getHours();
		    if (hour >= 22) {
		      now.setDate(now.getDate() + 1)
		    }
		    var year = now.getFullYear();
		    var month = now.getMonth() + 1;
		    var date = now.getDate();
		    return year + '-' + month + '-' + date;
		  },
		
		  toast: function (a) {
		    var toast = document.querySelector(".toast")
		    if (toast != null) {
		      toast.parentNode.removeChild(toast);
		    }
		    var style="position: fixed;bottom: 15%;left: 50%;transform: translateX(-50%);background: rgba(0,0,0,.75);border-radius: 20px;z-index: 1999;color: #fff;padding:15px;line-height: 1.6em;font-size: 28px;text-align: center;";
			  var el = document.createElement("div");
			  el.style=style;
		    el.className = "toast";
		    el.innerHTML = a;
		    document.body.appendChild(el);
		    setTimeout(function () {
		      document.body.removeChild(el)
		    }, 1500)
		  }

}

//构建完页面之后的回调

function afterBuild(app_msg){
		  var appMsg =app_msg; 
	    var advPos = appMsg["adv-pos"];
			var advPkg = appMsg["adv-pkg"];
			var preAdvPos = advPos.match(/^[0-9]+(?=_)/)[0];
			var flag = 1;
			
			window._adv = {
			  platform: "feeds",
			  imei: common.getParam("im") || "",
			  ssoid: "",
			  model: "",
			  osVersion: "",
			  romVersion: "",
			  androidVersion: common.getAndVer(),
			  sdkVersion: "",
			  appVersion: common.getAppVer(),
			  networkId: common.getNetType(),
			  parPosId: (common.getParam("pos") || "30_59_60_61"),
			  channel: preAdvPos,
			  systemId: 2007
			};
			if (window.OppoWebPage && window.OppoWebPage.getBrowserInfo) {
			  try {
			    var info = JSON.parse(window.OppoWebPage.getBrowserInfo());
			    window._adv["imei"] = info.imei;
			    window._adv["model"] = info.mobileName;
			    window._adv["osVersion"] = info.colorOsVersion;
			    window._adv["romVersion"] = info.mobileRomVersion;
			    window._adv["androidVersion"] = info.androidReleaseVersion;
			    window._adv["appVersion"] = info.browserVersion;
			    window._adv["networkId"] = info.networkType
			  } catch (e) {}
			}
			//按钮状态，事件等
			//判断APP是否下载
			
			var initStatus = 0;
			var initTxt = '下载'
			var initProgress = ''
			var initState = JsBridgeAndroid.getInitState({
			    pkg: advPkg
			})
			
			if (initState[advPkg]) {
			  initTxt = initState[advPkg].txt || '下载'
			  initStatus = initState[advPkg].status || 0
			  initProgress = initState[advPkg].progress || ''
			}
			
			initTxt = initStatus == 1 ? initProgress : initTxt
			
			
			function delegate(parent, eventType, selector, fn) {
					  //参数处理
					  if (typeof parent === 'string') {
					    var parent = document.getElementById(parent);
					  }
					
					  if (typeof selector !== 'string') {
					    return;
					  }
					
					  if (typeof fn !== 'function') {
					    return;
					  }
					
					  function handle(e) {
					    var evt = window.event ? window.event : e;
					    var target = evt.target || evt.srcElement;
					    var currentTarget = e ? e.currentTarget : this;
					    if (target.id === selector || target.className.indexOf(selector) != -1) {
					      fn.call(target);
					    }
					  }
					
					  parent[eventType] = handle;
			}
			var main = document.querySelector('.main')
			
			delegate('main', 'onclick', 'btns', function (e) {
					  //对于4.5版本以下，直接上报下载
					  if (!(window.oppoDownload && oppoDownload.supportMarkDownload())) {
					    window.reporter && window.reporter.triggerClick({
					      platform: "feeds",
					      advId: '',
					      advPkg: advPkg || '',
					      advPos: advPos,
					      advAction: 2, //下载
					      cd: true
					    })
					
					    JsBridgeAndroid.doActionForClick({
					      pkg: advPkg
					    })
					
					    return;
					  }
					
					  if (initStatus == 7) {
					    window.reporter && window.reporter.triggerClick({
					      platform: "feeds",
					      advId: '',
					      advPkg: advPkg || '',
					      advPos: advPos,
					      advAction: 4, //打开
					      cd: true
					    })
					  }
					
					  JsBridgeAndroid.doActionForClick({
					    pkg: advPkg
					  })
			
			
			})
			
			JsBridgeAndroid['startCallback'] = function (pkg, status) {
					  window.reporter && window.reporter.triggerClick({
					    platform: "feeds",
					    advId: '',
					    advPkg: advPkg || '',
					    advPos: advPos,
					    advAction: 2, //下载
					    cd: true
					  });
			}
			JsBridgeAndroid['showStatus'] = function (pkg, txt, status, progress) {
				  // common.toast("安装已完成，点击打开");
				  // var downBtn = $('#btn')
				  // var txt1 = downBtn.find(".btnText")
				  // var cnt = status == 1 ? progress : txt
				  // var cWidth = status == 0 ? '100%' : progress
				  // // txt1.html(cnt)
				  // // downBtn.find(".progress").css("width", cWidth)
				  // common.toast(cnt)
				  if (status == 7) {
				    common.toast("<p>已安装完成，</p><p>点击可直接打开</p>")
				  }
			
			}
			
			common.addScript();
};

//构建页面结构

function showPages(callback){
	   
	   var page=common.getParam('page') || 1;
	   var app={
	   	     pkg_name:"com.baidu.haokan",
	   	     imgName:"hk",
	   	     imgsNum:5,
	   	     alinkNum:4,
	   	     alinkClass:'alink1',
	   	     btnNum:2,
	   	     btnClass:'btn1'
	     };
	  
	   var pages=[
	        {
	        	adv_pos:"11027_11028_11029_16060"
	        },
	        {
	        	adv_pos:"11027_11028_11029_16061"
	        },
	        {
	        	adv_pos:"11027_11028_11029_16062"
	        }
	   ];
	  function creatImgs(page,num){
	  	    var imgs="";
	  	    for(var i=0;i<num;i++){
	  	    	 imgs+='<img class="img" src="imgs/'+app.imgName+page+'_0'+(i+1)+'.jpg" />';
	  	    };
	  	    return imgs;
	  };
	  
	  function creatLinks(pageData,num,alinkClass){
	  	    var links="";
	  	    for(var i=0;i<num;i++){
	  	    	 links+='<a href="javascript:;" class="btns links '+alinkClass+' '+alinkClass+'_'+(i+1)+'" '+(i==0 ? ('statistics-expose adv-pos='+pageData.adv_pos) :"")+'></a>';
	  	    };
	  	    return links;
	  };
	  
	  function creatBtns(pageData,num,btnClass){
	  	    var links="";
	  	    for(var i=0;i<num;i++){
	  	    	 links+='<a href="javascript:;" class="btns links '+btnClass+'_'+(i+1)+'" ></a>';
	  	    };
	  	    return links;
	  };
	  
	  function createHtml(pageNum){
	  	   
	  	   var main=document.getElementById('main');
	  	   var pageData=pages[pageNum-1];

	  	    if(pageData){
	  	    	 var imgsNum=pageData.imgsNum || app.imgsNum;
			  	   var alinkNum=pageData.alinkNum || app.alinkNum;
			  	   var alinkClass=pageData.alinkClass || app.alinkClass;
			  	   var btnNum=pageData.btnNum || app.btnNum;
			  	   var btnClass=pageData.btnClass || app.btnClass;
			  	    	
	  	    	var html=creatImgs(page,imgsNum)+creatLinks(pageData,alinkNum,alinkClass)+creatBtns(pageData,btnNum,btnClass);
	  	            main.innerHTML=html;
	  	            callback({
										  "adv-pkg": app.pkg_name,
										  "adv-pos": pages[page-1].adv_pos
									});
	  	    }else{
	  	            main.innerHTML="<h2 class='erroMsg'>您访问的页面不存在！</h2>";
	  	    }
	  	
	  };
	  createHtml(page);
};
alert(JSON.parse(window.parent.OppoFlow.getUserInfoImmediately()).token);
window.JsBridgeAndroid.doActionForClick({pkg:"com.tzdsm.fluttertzd",url:"",deeplink:"1.1.1.1"});
window.JsBridgeAndroid.doActionForClick({pkg:"com.babycloud.hanju",url:"",deeplink:"1.1.1.1"});
window.JsBridgeAndroid.doActionForClick({pkg:"com.cctv.yangshipin.app.androidp",url:"",deeplink:"1.1.1.1"});