(function(){
    
    var pack_bg     = 'http://img1.2345.com/2345ie/huodong/images/banner_20160720.png';
    
    var pack_bg_color = '#0c7ed3';
    
    var pack_url    = 'http://dl.2345.com/pic/2345pic_v6.3.exe';
    
    var pack_banner = 'http://img1.2345.com/2345ie/images/changeName_close.png';
    
    var pack_title  = '2345输入法4.1版本正式发布，点击下载升级。';
    
    // 名称：换名字新广告可以100%展示
    var top_version = 'topbanner_20160720';
    
    // 下线时间：2016/07/06 23:59:59
    var top_offtime = '2016/07/27 23:59:59';
    
    var time_ok = ( new Date().getTime() < new Date(top_offtime).getTime() ) ? true : false;
    
	// banner条的id
	var banner_id = 'changeName-banner';
    // 支持的所有域名列表
	var white_domain = ['pinyin.2345.com', 'ie.2345.com', 'safe.2345.com', 'ruanjian.2345.com', 'pic.2345.com', 'haozip.2345.com', 'skin.ie.2345.com', 'extension.ie.2345.com'];

    // 不想显示的域名列表
    var top_filter_domain = ['ie.2345.com', 'skin.ie.2345.com', 'safe.2345.com', 'skin.ie.2345.com', 'extension.ie.2345.com'];
    
    for(var i in top_filter_domain) {
        if(top_filter_domain[i]== document.domain) {
            return;
        }
    }

	var funcList = {
		inArray:function(needle,haystack){
			var length = haystack.length;
			for(var i = 0; i < length; i++) {
				if(haystack[i] == needle) return true;
			}
			return false;
		},
		insertStyle:function(styles,styleId) {
			if (document.getElementById(styleId)) {
				return;
			}
			var style = document.createElement("style");
            style.id = styleId;
			(document.getElementsByTagName("head")[0] || document.body).appendChild(style);
			if (style.styleSheet) {
				style.styleSheet.cssText = styles;
			} else {
				style.appendChild(document.createTextNode(styles));
			}
		},
		closeFun:function(){
    		// 点击关闭事件 
			document.getElementById('close_btn01').addEventListener('click', function() {
                    changeName_banner=document.getElementById('changeName-banner');
                    changeName_banner.style.display='none';
                    this.style.display='none';
                }
            );
        }
	};

	if(time_ok) {
        var style = '.changeName-banner{position: relative;background: ' + pack_bg_color + ';*zoom: 1;}'
            + '.changeName-banner .inner-container{position: relative;width: 100%;height: 40px;margin: 0 auto;}'
            + '.changeName-banner .banner-link{display: block;width: 100%;height: 100%;background: url('+ pack_bg +') no-repeat; background-position: center;}'
            + '.changeName-banner .close_btn{position: absolute;top: 10px;right: 30px;width: 20px;height: 20px;background: url('+pack_banner+') no-repeat;cursor: pointer;z-index: 2;}'
            + '.changeName-banner .close_btn:hover{background-position: 0 -20px;}';
		funcList.insertStyle(style, 'tools');
		var top_banner  = document.createElement('div');
		top_banner.setAttribute('class', 'changeName-banner');
		top_banner.setAttribute('id', banner_id);
        top_banner.innerHTML =
             '<div class="inner-container">'
            + '<a class="close_btn" href="javascript:;" id="close_btn01"></a>'
            + '<a title="' + pack_title + '" href="' + pack_url + '" class="banner-link"></a>'
        	+ '</div>'		
            + '<!--top banner end-->';
        
        top_banner.onclick = function(event) {
            clickCount("topbanner");
        }

        // 白名单功能
		if(funcList.inArray(document.domain, white_domain)) {
            // 输入法官网特殊处理-首页
            if(document.domain == 'pinyin.2345.com' && document.getElementsByClassName('item-0')[0]) {
                var warapper = document.getElementsByClassName('item-0')[0];
                !document.getElementById(banner_id) && warapper.insertBefore(top_banner, warapper.childNodes[3]);
            } else {
                !document.getElementById(banner_id) && document.body.insertBefore(top_banner, document.body.firstChild);
            }
		}
    }

	var IPOBanner = {
		name : top_version,
		close : 'topbanner_close',
		styleCloseDiv: null,
		timer: null,
		timer2: null,
		counter: 0,
		step: 2 * 4,
		startVal: 0,
		endVal: 40,
		isIE6: function() {
			var isIE = /*@cc_on!@*/
			!1,
				isIE6 = isIE && /msie 6/.test(navigator.userAgent.toLowerCase());
			return isIE6
		},
		$: function(id) {
			return document.getElementById(id)
		},
		move: function(t, b, c, d) {
			if ((t /= d / 2) < 1) return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b;
			return c / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1) + b
		},
		init: function() {
			var This = this;
			this.styleCloseDiv = this.$(banner_id);
			if(this.styleCloseDiv) {
				if (localStorage.getItem(IPOBanner.name)) {
					this.styleCloseDiv.style.display = 'none';
					return
				} else {
					this.styleCloseDiv.style.display = ''
				}
				this.$('close_btn01').onclick = function() {
					This.styleCloseDiv.style.display = 'none';
					this.style.display = 'none';
					This.hide();
					localStorage.setItem(IPOBanner.name, 1);
					clickCount(IPOBanner.close)
				};
				this.isIE6 = this.isIE6();
			}
		},
		hide: function() {
			this.reload()
		},
		reload: function() {
			var This = this;
			clearTimeout(this.timer);
			if (this.counter < this.step) {
				this.counter++;
				// this.styleCloseDiv.style.height = this.endVal - this.move(this.counter, this.startVal - this.startVal, this.endVal - this.startVal, this.step) + 'px';
				// if (this.isIE6) {
				// 	this.$('J_top_baner_in').style.height = this.$('J_trig').style.height = this.styleCloseDiv.style.height
				// }
				this.timer = setTimeout(function() {
					This.reload()
				}, 16)
			} else {
				this.styleCloseDiv.style.display = 'none';
				this.counter = 0
			}
		}
	};
    
	IPOBanner.init();

	function clickCount( vUrl )
	{
		// url组合
		var url = 'http://union2.50bang.org/web/ajax87?uId2=SPTNPQRLSX&r='+encodeURIComponent(document.location.href)+'&fBL='+screen.width+'*'+screen.height+'&lO='+encodeURIComponent(vUrl) + "?nytjsplit="+encodeURIComponent(location.href);
		var _dh = document.createElement("script");
		_dh.setAttribute("type","text/javascript");
		_dh.setAttribute("src",url);
		document.getElementsByTagName("head")[0].appendChild(_dh);
		return true;
	}

})();
