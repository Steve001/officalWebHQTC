function transformLanguage(newLanguage) {
    // 获取所有dom元素中文
    let transformStr = '提升全球农业生产效率,首页,产品,服务支持,关于我们,经销商,滑动查看更多';
    // 获取所有dom元素
    function getChildDom(dom, type, data = {}) {
        if (type == 'read') {
            [...dom.children].forEach(v => {
                // 判断中文
                // /^[\u0391-\uFFE5]+$/
                let re = /[\u4e00-\u9fa5]/g;
                // 防止某些标签有内容并且有标签 ，或者有空格 
                let vHtml = $(v).contents().filter(function(index, content) {
                    return content.nodeType === 3
                }).text().trim();
                // 跳过script标签
                if (re.test(vHtml) && v.tagName != 'SCRIPT') {
                    transformStr += `${vHtml},`
                }
                // 递归获取元素
                getChildDom(v, type, data);
            })
        } else {
            let transOld = data.trans_result[0].src.split(',');
            let transNew = data.trans_result[0].dst.split(',');
            [...dom.children].forEach(v => {
                // 判断中文
                // /^[\u0391-\uFFE5]+$/
                let re = /[\u4e00-\u9fa5]/g;
                let vHtml = $(v).contents().filter(function(index, content) {
                    return content.nodeType === 3
                }).text().trim();
                // 跳过script标签
                if (re.test(vHtml) && v.tagName != 'SCRIPT') {
                    // 防止标签里面还有标签，所以只替换里面的html,使用replace
                    $(v).html(
                        $(v).html().replace(
                            transOld[transOld.findIndex(arrList => arrList == vHtml)],
                            transNew[transOld.findIndex(arrList => arrList == vHtml)]
                        )
                    )
                }
                // 递归获取元素
                getChildDom(v, type, data);
            })
        }
    }
    getChildDom(document, 'read');
    getTranslateData();
    // 获取翻译
    function getTranslateData() {
        let appid = '20210624000871037'; // 百度翻译API的appid
        let key = 'jJzyzv6xGinpsRYqSl4f'; // 百度翻译API的key
        let salt = (new Date).getTime();
        let query = transformStr;
        let from = 'zh';
        let to = newLanguage;
        let str1 = appid + query + salt + key;
        let sign = md5(str1);
        $.ajax({
            url: 'http://api.fanyi.baidu.com/api/trans/vip/translate',
            type: 'get',
            dataType: 'jsonp',
            data: {
                q: query,
                appid: appid,
                salt: salt,
                from: from,
                to: to,
                sign: sign
            },
            success: function(data) {
                data.trans_result && getChildDom(document, 'write', data);
                $('#WidgetFloaterPanels').hide()
                console.log(data);
            }
        });
    }
}

window.onload = function() {
    WebLocation();
}

function WebLocation() {
    //判断浏览器的首选语言
    var language = navigator.language;
    console.log('11111', language)
    if (language == 'zh-CN') {
        // location.href = "中文网址";
    } else {
        // location.href = "英文网址";
        transformLanguage('en');
    }
}