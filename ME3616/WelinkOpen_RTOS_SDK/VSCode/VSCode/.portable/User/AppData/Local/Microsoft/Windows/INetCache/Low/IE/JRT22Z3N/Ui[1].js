/* 加速浏览器
 * Created:2013/08/13
 * Author:Rambo
 * Update:Gao 2016/04/29
 */
document.write("<script type='text/javascript' charset='gbk' src='http://ie.2345.com/js/footer.js?style=2345ie&20160824'></script>");

$(function(){
	
	var hoverObj = $(".mIcon-bg");
	var pcmBgObj = $("#curr-pc-m");
	var pcIconObj = $(".pcIcon-bg");
	
	hoverObj.mouseenter(function()
	{
		pcmBgObj.stop(true,true).animate({"left":"105px"},300);
		pcIconObj.addClass("pcIcon-lost");
		$(this).addClass("mIcon-hover");
	}).mouseleave(function()
	{
		pcmBgObj.stop(true,true).animate({"left":"1px"},300);
		pcIconObj.removeClass("pcIcon-lost");
		$(this).removeClass("mIcon-hover");
	});
	
	hoverObj.bind("click",function()
	{
		pcIconObj.removeClass("pcIcon-lost");
		$(this).removeClass("mIcon-hover");
		pcmBgObj.stop(true,true).animate({"left":"1px"},100);
	});
		
	// 皮肤hover
	$('#J_skin_box li').hover(function(){
		if(!$(this).hasClass("moreSkin")){
			$(this).addClass('hover');
		}
	},function(){
		if(!$(this).hasClass("moreSkin")){
			$(this).removeClass('hover');		
		}
	});

	mobileVistCheck();
	
	channelDownload();
	
	// TIPS文案
	downloadTips();
	
	//调用下载计数 2017-07-18 删掉此功能
	//getNum();
	
	// 百度统计
	var _hmt = _hmt || [];
	(function() {
	  var hm = document.createElement("script");
	  hm.src = "//hm.baidu.com/hm.js?cd08a1e51121cccef1389f8bee17bb8d";
	  var s = document.getElementsByTagName("script")[0]; 
	  s.parentNode.insertBefore(hm, s);
	})();
	
});

// 特殊渠道下载包
function channelDownload() {
	switch(location.search) {
		case '?wzt' :
			$("a.download-index-a").attr('href', 'http://download.2345.cc/2345Explorer_zt.exe');
		break;
	}
}

function mobileVistCheck() {
	// 微博专用链接
	if(/\?weibo/.test(location.search)) {
		return true;
	}
	if(navigator.userAgent.toLocaleLowerCase().match("(mobile|android)") != null) {
		(window.location.href = "http://app.2345.com/mob.htm?pc");
	}
}

// 内页侧栏树形
function clickHelp(n, o) {
	for (i = 1; i <= 4; i++) {
		if (i === n && $("#help_" + n).is(':hidden')) {
			$("#help_" + i).slideDown();
			$(o).addClass("current_cur");
		} else {
			$("#help_" + i).slideUp();
			$("#h" + i).removeClass("current_cur");
		}
	}
}

function changeCon(d, e) {
	$("#log_left .log_active").attr("class","");
	$("#log_right .show_border").attr("class","hidden_border");
	$(e).parent().attr("class","log_active");
	$("#"+d).attr("class","show_border");

}
function showLog(n,v){
	//$(v).innerHTML=eval("data."+v+"[0]["+n+"]")+"<img src='"+eval("data."+v+"[1]["+n+"]")+"'/>";
	var sHtml = $('#'+v+"_info_"+n).html()+"<img src='"+$('#'+v+"_img_"+n).attr("src")+"'/>";
	$('#'+v).html(sHtml);
	return false;
}


function clickCount( vUrl )
{
	//url组合
	var url = 'http://union2.50bang.org/web/ajax87?uId2=SPTNPQRLSX&r='+encodeURIComponent(document.location.href)+'&fBL='+screen.width+'*'+screen.height+'&lO='+encodeURIComponent(vUrl) + "&nytjsplit="+encodeURIComponent(location.href);
	var _dh = document.createElement("script");
	_dh.setAttribute("type","text/javascript");
	_dh.setAttribute("src",url);
	document.getElementsByTagName("head")[0].appendChild(_dh);
	return true;
} 

		
/*
 * 非加速浏览器提示及新版本提示
 * @Author Gao
 * @void
 */
function downloadTips()
{
	// 最新版本,此文件引用源是官网index.htm
	var upgrade_version = '9.4.3';//更改最新版本号需注意同步help\v7\js\nav.js（帮助页面）
	// var isBeta = '_beta';
	var isBeta = '';
	// 最新版本下载地址，需更新最新版本号upgrade_version字段
	var new_ver_name = 'http://dl.2345.cc/2345explorer/2345Explorer_Setup_V'+upgrade_version + isBeta;
	var upgrade_href = new_ver_name+'.exe';
	var fromUrl=document.referrer;

	if(fromUrl){
		fromArr = fromUrl.split('//');
		fromUrl = fromArr[1];
		/**
	    if(fromUrl.indexOf('www.baidu.com') == 0){
	        upgrade_href = new_ver_name+'_bd.exe'; 
	    }else if(fromUrl.indexOf('www.2345.com') == 0){
	    	upgrade_href = new_ver_name+'_dh.exe'; 
	    }
	    */
	}

	// 判断浏览器
	function is_2345chrome(){
		return /2345(chrome|Explorer)/.test(window.navigator.userAgent);
	}

	// 获取版本号
	function queryBrowserVersion(){
		if(/2345Explorer\//.test(navigator.userAgent)) {
			return Array.prototype.pop.call(String.prototype.split.call(navigator.userAgent, "2345Explorer/"));
		} else {
			return Array.prototype.pop.call(String.prototype.split.call(navigator.userAgent, " v"));
		}
	}

	// 版本号比较 one < two
	function ltVersionString(version_one, version_two){
		var two = String.prototype.split.call(version_two, ".");
		var result = false; // default eq
		$(String.prototype.split.call(version_one, ".")).each(function(index, subv){
			if( subv < two[index] )
			{
				result = true;
				return false;
			}
		    else if( subv > two[index] )
		    {
		    	result = false;
		    	return false;
		    }
		});

		return result;
	}

	// 验证浏览器版本错误
	function getBrowserError(){
		var browser_state = 3;
		if(/2345chrome/.test(window.navigator.userAgent)){
			// chrome 浏览器版本号小于4.0
			browser_state =  ltVersionString(queryBrowserVersion(), upgrade_version) ? 1 : 0;
		} else if(/2345Explorer/.test(window.navigator.userAgent)){
			// explorer 版本号小于最新版本
			browser_state = ltVersionString(queryBrowserVersion(), upgrade_version) ? 2 : 0;
		}
		try {
			window.external.RCCoralGetItemCacheType();
			browser_state = 0;
		} catch(e) {
        }
		try {
			var version_arr = window.external.RCCoralGetVersion().split('.'); // 3.2.0.11764
			var version = parseFloat( version_arr[0] + '.'+ version_arr[1] );
			if(version < upgrade_version) {
				browser_state = 2;
			}
		}catch(e) {
		}
		
		// 非2345浏览器
		return browser_state;
	}	
	
	function show2345DownTip() {
		var div_notice = document.createElement('div');
        div_notice.setAttribute('id', 'notice');
        div_notice.setAttribute('class', 'tip_mod');
		div_notice.setAttribute('className', 'tip_mod');
        div_notice.style.display = 'block';
        
        var div_inner  = document.createElement('div');
        div_inner.setAttribute('class', 'inner');
		div_inner.setAttribute('className', 'inner');
        var span_tips = document.createElement('span');
        span_tips.setAttribute('class', 'tips_skin');
		span_tips.setAttribute('className', 'tips_skin');
        span_tips.innerHTML = '温馨提示：您当前使用的浏览器不是2345加速浏览器，建议您下载最新版本2345加速浏览器';
        
        var a_span  = document.createElement('a');
        a_span.setAttribute('href', upgrade_href);
        a_span.setAttribute('onclick', "clickCount('ie_index_down_top')");
        a_span.innerHTML = '点击下载';
        
        span_tips.appendChild(a_span);
        div_inner.appendChild(span_tips);
        div_notice.appendChild(div_inner);
        
        // 关闭按钮
        var a_close = document.createElement('a');
        a_close.setAttribute('id', 'close');
        a_close.setAttribute('href', 'javascript:;');
        a_close.setAttribute('class', 'close');
		a_close.setAttribute('className', 'close');
        div_notice.appendChild(a_close);
        
        document.body.insertBefore(div_notice, document.body.firstChild);
        document.getElementById('close').onclick = function(){
            document.getElementById('notice').style.display = 'none';
        };
	}
	
	function show2345UpdateTip() {
		var div_notice = document.createElement('div');
		div_notice.setAttribute('id', 'notice_upgrade');
		div_notice.setAttribute('class', 'tip_mod');
		div_notice.setAttribute('className', 'tip_mod');
		div_notice.style.display = 'block';
		
		var div_inner  = document.createElement('div');
		div_inner.setAttribute('class', 'inner');
		div_inner.setAttribute('className', 'inner');
		var span_tips = document.createElement('span');
		span_tips.setAttribute('class', 'tips_skin');
		span_tips.setAttribute('className', 'tips_skin');
		span_tips.innerHTML = '2345加速浏览器已发布最新版本，升级上网快更快速！';

		var a_span  = document.createElement('a');
        a_span.setAttribute('href', upgrade_href);
		a_span.setAttribute('onclick', "clickCount('ie_index_down_top')");
		a_span.innerHTML = '点击下载';

		span_tips.appendChild(a_span);
		div_inner.appendChild(span_tips);
		div_notice.appendChild(div_inner);

		// 关闭按钮
		var a_close = document.createElement('a');
		a_close.setAttribute('id', 'close');
		a_close.setAttribute('href', 'javascript:;');
		a_close.setAttribute('class', 'close');
		a_close.setAttribute('className', 'close');
		div_notice.appendChild(a_close);
		document.body.insertBefore(div_notice, document.body.firstChild);
		document.getElementById('close').onclick = function(){
			document.getElementById('notice_upgrade').style.display = 'none';
		};
	}
	
	var version_index = getBrowserError();
	
	if(version_index == 3) {
		// 非2345浏览器
		show2345DownTip();
	} else if (version_index == 2 || version_index == 1) {
		// 2345Explorer 小于最新版本，提示升级
		show2345UpdateTip();
	} else {
		// 2345浏览器
	}
	
}

//下载计数js	
function getNum() {
	var one = null;
	var headObj = document.getElementsByTagName("head").item(0);
	one = document.createElement("script");
	one.src = "http://ie.2345.cc/num.txt?t" + new Date().getTime();
	headObj.appendChild(one);
}

function make_change(num) {
	var origNumStr = '';
	var numArr = num.split('');
	for (var i in numArr)
	{
		origNumStr = origNumStr + "<span><i></i>" + numArr[i] + "</span>"
	}
	if (origNumStr !== '')
	{
		$('#origNum').html(origNumStr);
	}
}