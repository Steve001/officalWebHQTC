function suchenFn() {};
var WIDTH = document.documentElement.clientWidth;
var HEIGHT = document.documentElement.clientHeight;
var myLoading; //鐢ㄤ簬鍔犺浇鍑芥暟璋冪敤
var u = navigator.userAgent,
    app = navigator.appVersion
var isIOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/);
var remFont; //鐢ㄤ簬绯荤粺瀛椾綋瀛樺偍
suchenFn.prototype = {
    /*
     *	----绉诲姩绔痳em瀹氫箟
     * 		浣跨敤鏂规硶锛�
     * 			浠�750璁捐鍥句负鍙傝€�    1rem = 100px
     * 			閰嶅悎锛�<meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no" />
     * */
    rem: function() {
        var win = window;
        var lib = window['lib'] || (window['lib'] = {})
        var doc = win.document;
        var docEl = doc.documentElement;
        var metaEl = doc.querySelector('meta[name="viewport"]');
        var flexibleEl = doc.querySelector('meta[name="flexible"]');
        var dpr = 0;
        var scale = 0;
        var tid;
        var flexible = lib.flexible || (lib.flexible = {});

        if (metaEl) {
            // console.warn('灏嗘牴鎹凡鏈夌殑meta鏍囩鏉ヨ缃缉鏀炬瘮渚�');
            var match = metaEl.getAttribute('content').match(/initial\-scale=([\d\.]+)/);
            if (match) {
                scale = parseFloat(match[1]);
                dpr = parseInt(1 / scale);
            }
        } else if (flexibleEl) {
            var content = flexibleEl.getAttribute('content');
            if (content) {
                var initialDpr = content.match(/initial\-dpr=([\d\.]+)/);
                var maximumDpr = content.match(/maximum\-dpr=([\d\.]+)/);
                if (initialDpr) {
                    dpr = parseFloat(initialDpr[1]);
                    scale = parseFloat((1 / dpr).toFixed(2));
                }
                if (maximumDpr) {
                    dpr = parseFloat(maximumDpr[1]);
                    scale = parseFloat((1 / dpr).toFixed(2));
                }
            }
        }

        if (!dpr && !scale) {
            var isAndroid = win.navigator.appVersion.match(/android/gi);
            var isIPhone = win.navigator.appVersion.match(/iphone/gi);
            var devicePixelRatio = win.devicePixelRatio;
            if (isIPhone) {
                // iOS涓嬶紝瀵逛簬2鍜�3鐨勫睆锛岀敤2鍊嶇殑鏂规锛屽叾浣欑殑鐢�1鍊嶆柟妗�
                if (devicePixelRatio >= 3 && (!dpr || dpr >= 3)) {
                    dpr = 3;
                } else if (devicePixelRatio >= 2 && (!dpr || dpr >= 2)) {
                    dpr = 2;
                } else {
                    dpr = 1;
                }
            } else {
                // 鍏朵粬璁惧涓嬶紝浠嶆棫浣跨敤1鍊嶇殑鏂规
                if (devicePixelRatio >= 3 && (!dpr || dpr >= 3)) {
                    dpr = 3;
                } else {
                    dpr = 2;
                }
            }
            scale = 1 / dpr;
        }

        docEl.setAttribute('data-dpr', dpr);
        if (!metaEl) {
            metaEl = doc.createElement('meta');
            metaEl.setAttribute('name', 'viewport');
            metaEl.setAttribute('content', 'initial-scale=' + scale + ', maximum-scale=' + scale + ', minimum-scale=' + scale + ', user-scalable=no');
            if (docEl.firstElementChild) {
                docEl.firstElementChild.appendChild(metaEl);
            } else {
                var wrap = doc.createElement('div');
                wrap.appendChild(metaEl);
                doc.write(wrap.innerHTML);
            }
        }

        function refreshRem() {
            var width = docEl.getBoundingClientRect().width;
            if (width / dpr > 540) {
                width = 540 * dpr;
            }
            var rem = width / 7.5;
            docEl.style.fontSize = rem + 'px';
            remFont = rem;
            flexible.rem = win.rem = rem;
        }

        win.addEventListener('resize', function() {
            clearTimeout(tid);
            tid = setTimeout(refreshRem, 300);
        }, false);
        win.addEventListener('pageshow', function(e) {
            if (e.persisted) {
                clearTimeout(tid);
                tid = setTimeout(refreshRem, 300);
            }
        }, false);

        if (doc.readyState === 'complete') {
            doc.body.style.fontSize = 12 * dpr + 'px';
        } else {
            doc.addEventListener('DOMContentLoaded', function(e) {
                doc.body.style.fontSize = 12 * dpr + 'px';
            }, false);
        }


        refreshRem();

        flexible.dpr = win.dpr = dpr;
        flexible.refreshRem = refreshRem;
        flexible.rem2px = function(d) {
            var val = parseFloat(d) * this.rem;
            if (typeof d === 'string' && d.match(/rem$/)) {
                val += 'px';
            }
            return val;
        }
        flexible.px2rem = function(d) {
            var val = parseFloat(d) / this.rem;
            if (typeof d === 'string' && d.match(/px$/)) {
                val += 'rem';
            }
            return val;
        }
    },
    
    adminFont: function() {
        var win = window;
        var lib = window['lib'] || (window['lib'] = {})
        var doc = win.document;
        var docEl = doc.documentElement;
        var flexible = lib.flexible || (lib.flexible = {});
        if (docEl.currentStyle) {
            var user_webset_font = docEl.currentStyle['fontSize'];
        } else {
            var user_webset_font = win.getComputedStyle(docEl, false)['fontSize'];
        }
        user_webset_font = parseFloat(user_webset_font);
        if (Math.round(user_webset_font) != Math.round(remFont)) {
            var scale = parseFloat(remFont) / parseFloat(user_webset_font);
            var showREM = scale * remFont
            docEl.style.fontSize = showREM + 'px';
            flexible.rem = win.rem = showREM;
        }
    },
	IsPC:function() {
	    var userAgentInfo = navigator.userAgent;
	    var Agents = ["Android", "iPhone",
	        "SymbianOS", "Windows Phone",
	        "iPad", "iPod"
	    ];
	    var flag = true;
	    for (var v = 0; v < Agents.length; v++) {
	        if (userAgentInfo.indexOf(Agents[v]) > 0) {
	            flag = false;
	            break;
	        }
	    }
	    return flag;
	},
	resizeISMobile:function () {
	    var flag = publicFn.IsPC();
	    if (flag === true) {
	        console.log("pc端");
	    } else {
	        console.log("移动端");
			window.location.href = 'https://www.hqtcsz.cn/mobile';
	    }
	}
}



var publicFn = new suchenFn();
publicFn.rem();
publicFn.adminFont();
publicFn.resizeISMobile();