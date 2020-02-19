/**
 * Created by zhengxiaoyong on 16/4/18.
 *
 * native结果数据返回格式:
 * var resultData = {
    status: {
        code: 0,//0成功，1失败
        msg: '请求超时'//失败时候的提示，成功可为空
    },
    data: {}//数据,无数据可以为空
};
 协定协议:rainbow://class:port/method?params;
 params是一串json字符串
 */
alert(12345);
function getValue(obj,key){
    if(obj[key]){
        return obj[key];
    }else{
        return '';
    }
}
(function () {
    var doc = document;
    var win = window;
    var ua = win.navigator.userAgent;
    var JS_BRIDGE_PROTOCOL_SCHEMA = "rainbow";
    var increase = 1;
    var RainbowBridge = win.RainbowBridge || (win.RainbowBridge = {});

    var ExposeMethod = {

        callMethod: function (clazz, method, param, callback ,oldname) {
            if(window.android){
                    switch(method){
                        case 'setClientTitle':
                        if(android.setClientTitle)var temp = android.setClientTitle(getValue(param,'title'))
                        // var temp = android.setVerificationClientTitle(getValue(param,'title'),getValue(param,'isNeedBackIcon'),getValue(param,'backText'),getValue(param,'nextText'));
                        if(android.setVerificationClientTitle)var temp = android.setVerificationClientTitle(getValue(param,'title'),getValue(param,'isNeedBackIcon'),getValue(param,'backText'),'');
                        break;
                        case 'controlNativeTitle':
                        //账号没用此接口
                        break;
                        case 'getToken':
                        var temp = {
                            status:{
                                    code:0
                                },
                                data:{
                                    token:android.getToken()
                                }
                        }
                        break;
                        case 'getClientContext':
                        var headerJson = JSON.parse(android.getHeaderJson());
                        var language;
                        if(android.getClientLanguage){
                            language = android.getClientLanguage().split('/').pop();//当前语言环境
                        }else{
                            var a =  android.getClientCountry();
                            var scalelang = false;
                            switch(a){
                                case 'CN':language = 'zh-CN';break;
                                case 'TW':language = 'zh-TW';break;
                                case 'US':language = 'en-US';break;
                                default:language = 'en-US';break;
                            };
                        };
                        var temp = {
                                status:{
                                    code:0
                                },
                                data:{
                                    imei:headerJson['Ext-USER'],//手机imei
                                    ucimei:"",//个人中心唯一标识，暂时无用
                                    model:(headerJson['Ext-USER'].split('/'))[0],//手机型号
                                    serial:"",//设备序列号
                                    deviceId:"",//设备ID，帐号系统生成，暂时无用
                                    mac:"",//手机mac地址
                                    language:language,//当前语言环境
                                    ColorOsVersion:"",//coloros版本号
                                    romBuildDisplay:"",//构建版本号
                                    languageTag:language,//当前语言环境
                                    packagename:"com.oppo.usercenter",//包名
                                    appVersion:"",//apk版本号
                                    IsOPPOExp:false//是否OPPO外销机型
                                }
                            }
                        break;
                        case 'getHeaderJson':
                        var temp = {
                                status:{
                                    code:0
                                },
                                data:android.getHeaderJson(),
                            }
                        break;
                        case 'setNextBtnEnabled':
                        var temp = android.setVerifyBtnEnabled(getValue(param,'isEnabled'))
                        break;
                        case 'onFinish':
                        if(param.needResult){
                            if(param.operate.operateType == 'verifySystem'){
                                var temp = android.onVerificationResult(JSON.parse(param.operate.operateResult).ticketNo,'');
                            }else if(param.operate.operateType == 'findPwd2Logout'){
                                var temp = android.onPasswordChange(getLang('msg_bindPasswordSuccess'));          //修改密码成功通知客户端 请求toast样式气泡
                            }
                        }else{
                            var temp = android.onFinish(getValue(param,'message'))
                        }
                        break;
                        case 'statisticsDCS':
                        //旧账号没有统计埋点
                        break;
                        case 'onStartSmsCode':
                        setTimeout(function(){android.onStartSmsCode(getValue(param,'smsLength'),'javascript:getCode(@ParamStr)');},500)
                        var temp = {
                                status:{
                                    code:0
                                },
                                data:{
                                    smsCode:'',
                                }
                            }
                        break;
                        case 'showToast':
                        var temp = android.showToast(getValue(param,'message'))
                        break;
                        case 'getClientLocation':
                        //账号没有调用此接口
                        var temp = {
                                status:{
                                    code:0
                                },
                                data:{
                                    address:'',
                                    provice:'',
                                    city:'',
                                    latitude:'',
                                    longitude:'',
                                    coorType:''
                                }
                            }
                        break;
                        case 'showClientDialog':
                        //弹出客户端对话框
                        //本地H5兼容  showEmergency.html
                        if(param.dialogType == 'DELETE_ALERT_DIALOG_TWO'){
                            var temp = param.callback();
                        }else{
                            common.getAndroidAlret(param);
                        }
                        break;
                        case 'printLog':
                        var temp = android.printLog(getValue(param,'log'))
                        break;
                        case 'getCountryCallingCode':
                        var temp = {
                            status:{
                                    code:0
                                },
                                data:{
                                    mobilePrefix:'+86',
                                    name:'中国',
                                }
                        }
                        break;
                        case 'openBrowser':
                        var temp = android.onOpenBrowser(getValue(param,'url'));
                        break;
                        case 'statisticsStartPage':
                        //旧账号无统计接口
                        break;
                        case 'getH5InitParam':
                        var temp = {
                            status:{
                                    code:0
                                },
                            data:{
                                param:android.getH5InitParam()
                            }
                        };
                        break;
                        case 'getDetailShowInfo':
                        var temp = {
                            status:{
                                    code:0
                                },
                            data:{
                                showInfo:android.getDetailShowInfo()
                            }
                        };
                        break;
                        case 'onFinishAll':
                        var temp = android.onFinish(getValue(param,'message'))
                        break;
                    }
                callback(temp)
            }else{
                var port = PrivateMethod.generatePort();
                if (typeof callback !== 'function') {
                    callback = null;
                }
                PrivateMethod.registerCallback(port, callback);
                PrivateMethod.callNativeMethod(clazz, port, method, param);
            }
        },

        onComplete: function (port, result) {
            PrivateMethod.onNativeComplete(port, result);
        }

    };

    var PrivateMethod = {
        callbacks: {},
        registerCallback: function (port, callback) {
            if (callback) {
                PrivateMethod.callbacks[port] = callback;
            }
        },
        getCallback: function (port) {
            var call = {};
            if (PrivateMethod.callbacks[port]) {
                call.callback = PrivateMethod.callbacks[port];
            } else {
                call.callback = null;
            }
            return call;
        },
        unRegisterCallback: function (port) {
            if (PrivateMethod.callbacks[port]) {
                delete PrivateMethod.callbacks[port];
            }
        },
        onNativeComplete: function (port, result) {
            var resultJson = PrivateMethod.str2Json(result);
            var callback = PrivateMethod.getCallback(port).callback;
            PrivateMethod.unRegisterCallback(port);
            if (callback) {
                //执行回调
                callback && callback(resultJson);
            }
        },
        generatePort: function () {
            return Math.floor(Math.random() * (1 << 50)) + '' + increase++;
        },
        str2Json: function (str) {
            if (str && typeof str === 'string') {
                try {
                    return JSON.parse(str);
                } catch (e) {
                    return {
                        status: {
                            code: 1,
                            msg: 'params parse error!'
                        }
                    };
                }
            } else {
                return str || {};
            }
        },
        json2Str: function (param) {
            if (param && typeof param === 'object') {
                return JSON.stringify(param);
            } else {
                return param || '';
            }
        },
        callNativeMethod: function (clazz, port, method, param) {
            if (PrivateMethod.isAndroid()) {
                var jsonStr = PrivateMethod.json2Str(param);
                var uri = JS_BRIDGE_PROTOCOL_SCHEMA + "://" + clazz + ":" + port + "/" + method + "?" + jsonStr;
                win.prompt(uri, "");
            }
        },
        isAndroid: function () {
            // var tmp = ua.toLowerCase();
            // var android = tmp.indexOf("android") > -1;
            // return !!android;
            return true;
        },
        isIos: function () {
            var tmp = ua.toLowerCase();
            var ios = tmp.indexOf("iphone") > -1;
            return !!ios;
        }
    };
    for (var index in ExposeMethod) {
        if (ExposeMethod.hasOwnProperty(index)) {
            if (!Object.prototype.hasOwnProperty.call(RainbowBridge, index)) {
                RainbowBridge[index] = ExposeMethod[index];
            }
        }
    }
})();
RainbowBridge.callMethod('JSCommondMethod', 'getToken', {}, function(msg) {
	alert(556677);
	alert(msg);
            if (msg.status.code == 0) {
			alert(JSON.stringify(msg.data));
                if (msg.data.token) {
                    location.reload();
                } else {
                    RainbowBridge.callMethod('JSCommondMethod', 'onFinish', {}, function() {});
                }
            } else {
			alert(1);
                RainbowBridge.callMethod('JSCommondMethod', 'onFinish', {}, function() {});
            }
        });



