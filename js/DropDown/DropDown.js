/**
 * DropDown 下拉菜单
 *
 */
;
(function($, window, document, undefined) {
    'use strict';
    // 默认参数
    var Data = {
        defaults: {
            mode: 'single', // 类型 多选multiple 单选single
            type: 'select', // 下拉类型 默认select  图片img  树tree
            url: '', // 图片下拉指定图片目录
            data: [], // 数据数组
            tips: '', // 提示内容
            name: '', // input Name值
            id: '', // input ID值
            disable: false, // 禁用
            class: '', // 为插件分配class
            value: '', // 选中的值
            empty: false, // 设置选中时，是否清空原有选中
            subset: -1, // 树下拉规定只能选择哪一级
            revert: 'id', // 返回类型 id array  返回数组目前只支持单选
            hide: 0, // N秒后自动关闭
            selectCol: 1, // 下拉列表显示列数
        }
    };
    // 插件引擎
    var Engine = {
        // 获取属性设置
        getAttrSettings: function($original) {
            let defaults = Data.defaults;
            var attrData = { data: [], tips: '', selectCount: 0 };
            $.each(defaults, (key, val) => {
                if ($original.is('[data-' + key + ']')) {
                    var elAttr = $original.attr('data-' + key);
                    if (elAttr === 'true' || elAttr === 'false') { elAttr = elAttr === 'true'; }
                    if ($original.data('type') === "img" && key === "mode") {
                        // 图片下拉暂不支持多选
                        elAttr = 'single';
                    }
                    // 多选不支持返回数组
                    if (key === "mode" && elAttr === "multiple" && $original.attr('data-revert') === "array") {
                        console.error('Multiple selection does not support returning arrays');
                        return false;
                    }
                    if (elAttr === "") { elAttr = defaults[key]; }
                    attrData[key] = elAttr;
                }
            })
            // 生成数组
            if ($original.children('option').length > 1) {
                $original.children('option').each(function(e) {

                    // 获取下拉菜单option
                    var opt_this = $(this),
                        // option的val
                        val = isNaN(opt_this.attr('value')) ? opt_this.attr('value') : Number(opt_this.attr('value')),
                        // 是否选中
                        selected = opt_this.data('selected') ? opt_this.data('selected') : '',
                        // option 内容
                        text = opt_this.text();
                    attrData.selectCount = text.length > attrData.selectCount ? text.length : attrData.selectCount;
                    // 添加option属性
                    attrData.data.push({ val: val, label: text, selected: selected })
                    // 添加自定义属性
                    $.each(opt_this.data(), function(index, val) {
                        if (index !== "selected") {
                            attrData.data[e][index] = val;
                        }
                    });
                })
            }
            return attrData;
        },
        // 初始化
        initialize: function($original, userSettings) {
            var self = this;
            var settings = $.extend(true, {}, userSettings);
            var attrSettings = self.getAttrSettings($original);
            settings = $.extend(settings, attrSettings);
            var $plutinHtml = Build.build($original, settings);
            $plutinHtml.insertBefore($original);
            // 设置多列的宽度以及位置
            if (attrSettings.selectCol > 1) {
                var slt_list = $plutinHtml.find('.slt_list'),
                    slt_left = $plutinHtml.offset().left,
                    body_width = $('body').width(),
                    list_width = settings.selectCol * settings.selectCount * 14 + settings.selectCol * 28;
                    slt_list.css('width', list_width + 'px').children().css('width', 100 / settings.selectCol + '%');
                if(body_width - slt_left < slt_list.width()){
                    slt_list.css('right','0px');
                }
            }
            $original.remove();
            Binds.bind($plutinHtml, settings);
            return $plutinHtml;
        },
        // 检查目标
        controlTarget: function($target, controls) {
            // 初始化时是否是input
            if ($.inArray('isSelect', controls) !== -1 && !$target.is('select')) {
                console.error('DropDown | initialization failed，Invalid select element');
                console.log($target[0]);
                return false;
            }
            // 是否初始化
            if ($.inArray('isInitialized', controls) !== -1 && !$target.hasClass('m_dropdown')) {
                console.error('DropDown | select is not initialized');
                console.log($target[0]);
                return false;
            }
            // 是否唯一
            if ($.inArray('isSingle', controls) !== -1 && $target.length > 1) {
                console.error('DropDown | Can only be called on a single element');
                console.log($target[0]);
                return false;
            }
            return true;
        },
        // 检查values
        controlValues: function($target, values) {
            if (!(values instanceof Object)) {
                console.error('values parameter is not a valid Object');
                console.log($target[0]);
                console.log(values);
                return false;
            }
            return true;
        },
        // 设置
        setSelect: function($target, valObjs) {
            let self = this,
                select_list = Build.select_list($target, valObjs);
            // 设置值
            $target.find('.text').removeClass('tips').html(select_list.text);
            $target.find(`input`).val(select_list.value.length > 0 ? select_list.value : '');
            if ($target.data('type') === "tree") {
                $target.find('.tree_list').html(select_list.html);
            } else {
                $target.find('.slt_list').html(select_list.html);
            }
            // 返回当前值
            let value = typeof select_list.value[0] == 'object' ? JSON.stringify(select_list.value[0]) : select_list.value[0]
            $(document).trigger('select:' + $target.data('class'), value);
            return $target;
        },
        // 设置选中值
        setSelectValue: function($target, valObjs) {
            let slef = this,
                ipt = $target.children('input'),
                slt_list = $target.data('type') !== "tree" ? $target.children('.slt_list') : $target.children('.tree_list'),
                text = $target.children('.text'),
                valObjs_value = valObjs.value.split(',');
            var opt = {
                value: [],
                html: []
            };
            var ipt_val = '';
            if (valObjs.empty !== undefined) {
                if (valObjs.empty === 'true' || valObjs.empty === 'false') { valObjs.empty = valObjs.empty === 'true'; }
            } else {
                valObjs.empty === false;
            }

            // 是否清除原有选中值
            if (valObjs.empty === true) {
                if ($target.data('mode') === "multiple") {
                    opt.value = valObjs_value.filter(s => $.trim(s).length > 0);
                } else {
                    opt.value[0] = valObjs_value[0];
                }
                // 移出选中效果
                if ($target.data('type') !== "tree") {
                    slt_list.children().removeClass('active');
                } else {
                    slt_list.find('.tree_item').removeClass('active');
                }
            } else {
                if ($target.data('mode') === "multiple") {
                    // 合并、去重、去空
                    opt.value = $.merge(ipt.attr('value').split(','), valObjs_value);
                    opt.value = $.unique(opt.value.sort()).filter(s => $.trim(s).length > 0);
                } else {
                    if (ipt.attr('value').split(',')[0] == valObjs_value[0]) {
                        console.log('当前设置value已经存在');
                        return false;
                    } else {
                        opt.value[0] = valObjs_value[0];
                    }
                }
            }
            // 设置选中值
            opt.value.map(function(e, idx) {
                if ($target.data('type') !== "tree") {
                    if ($target.data('mode') == 'multiple') {
                        slt_list.children('.slt_item' + e).addClass('active');
                        opt.html.push(`<span data-value="${e}">${slt_list.children('.slt_item' + e).children().html()}<i class="ic i_c"></i></span>`);
                    } else {
                        slt_list.children().removeClass('active');
                        slt_list.children('.slt_item' + e).addClass('active');
                        opt.html.push(slt_list.children('.slt_item' + e).children().html());
                    }
                } else {
                    if ($target.data('mode') == 'multiple') {
                        slt_list.find(`.selected_${e}`).addClass('active');
                        opt.html.push(`<span data-value="${e}">${slt_list.find(`.selected_${e}`).children().text()}<i class="ic i_c"></i></span>`);
                    } else {
                        slt_list.find('.tree_item').removeClass('active');
                        slt_list.find(`.selected_${e}`).addClass('active');
                        opt.html.push(slt_list.find(`.selected_${e}`).children().text());
                        if ($target.data('revert') === "array") {
                            ipt_val = JSON.stringify(slt_list.find(`.selected_${e}`).data('array'));
                        }
                    }
                }
            })
            // 设置值
            text.removeClass('tips').html(opt.html);
            ipt.val($target.data('revert') === "array" ? '' : opt.value.length > 0 ? opt.value : '');
            // 返回当前值
            $(document).trigger('select:' + $target.data('class'), $target.data('revert') === "array" ? ipt_val : ipt.val());
            slt_list.css('top', text.height() + 10);
            return $target;
        }
    };
    // 创建
    var Build = {
        // 初始化HTML
        build: function($original, settings) {
            let self = this,
                select_list = self.select_list($original, settings);
            // 新增下拉菜单列表
            var list_opts;
            if (settings.type === "tree") {
                list_opts = $('<ul class="tree_list"/>').append(select_list.html);
            } else {
                list_opts = $(`<ul class="slt_list"/>`).append(select_list.html);
            }
            // 是否显示默认字符
            let select_label = $(`<div class="text ${select_list.text.length > 0 ?'':'tips'}"/>`).append(select_list.text.length > 0 ? select_list.text : settings.tips);
            // 设置value,并判断ID是否存在
            var val_html;
            if (settings.id) {
                val_html = $(`<input class="dn" type="hidden" id="${settings.id}" name="${settings.name}" value="${select_list.value.length > 0 ? select_list.value : ''}"></input>`);
            } else {
                val_html = $(`<input class="dn" type="hidden" name="${settings.name}" value="${select_list.value.length > 0 ? select_list.value : ''}"></input>`);
            }
            // 新增
            let $select = $(`<div class="m_dropdown ${settings.class} ${settings.disable} ${settings.mode}" data-type="${settings.type}" data-mode="${settings.mode}" data-class="${settings.class}" data-revert="${settings.revert}" data-subset="${settings.subset}"/>`).append(select_label, val_html, '<i class="ic i_f_b"></i>', list_opts);
            return $select;
        },
        // 生成下拉列表
        select_list: function($target, settings) {
            let data = settings.data.length > 0 ? settings.data : [],
                url = settings.url ? settings.url : '',
                value = settings.value ? settings.value : '',
                mode = $target.data('mode') ? $target.data('mode') : settings.mode,
                type = $target.data('type') ? $target.data('type') : settings.type,
                revert = $target.data('revert') ? $target.data('revert') : 'id',
                subset = $target.data('subset') ? $target.data('subset') : settings.subset;
            var in_selected = null, // 选中列表
                // 树下拉菜单展开与合并图标
                more_ic = `<div class="more_ic contract_btn active" data-tid="">
                    <span class="ic i_i_ji"></span>
                    <span class="ic i_i_j"></span>
                </div>`,
                is_value = value && value !== "" ? true : false,
                val = typeof value == 'number' ? value.toString() : value, //数字需要处理成字符串
                opt = { // 选中列表
                    value: val && val !== "" ? mode == 'multiple' ? val.split(',') : [val.split(',')[0]] : [],
                    html: type === 'tree' ? $(`<ul class="m_list_tree m_list_more ${subset === 1?'subset_'+subset:''}" />`) : '',
                    text: []
                };
            data.map(function(e, idx) {
                // 普通下拉菜单
                if (type !== "tree") {
                    if (is_value === true) {
                        let in_val = $.inArray(e.val.toString(), opt.value);
                        if (mode === 'multiple' && in_val !== -1) {
                            in_selected = e.val;
                        }
                        if (mode === 'single' && in_val !== -1) {
                            in_selected = in_selected === null ? e.val : in_selected;
                        }
                    } else {
                        if (mode === 'multiple' && e.selected === true) {
                            in_selected = e.val;
                        }
                        if (mode === 'single' && e.selected === true) {
                            in_selected = in_selected === null ? e.val : in_selected;
                        }
                    }
                    // 默认下拉菜单
                    if (type === "select") {
                        var itemData = '';
                        $.each(e, function(itemKdy, itemVal) {
                            if (itemKdy != 'selected' && itemKdy != 'label') {
                                itemData += `data-${itemKdy==='val'?'value':itemKdy}="${itemVal}" `;
                            }
                        });
                        opt.html +=
                            `<li class="slt_item${e.val} ${e.val == in_selected?'active':''}" ${itemData}>
                            <span>${e.label}</span>
                        </li>`;
                        // 设置默认选中的值
                        if (e.val == in_selected) {
                            // 是否多选
                            if (mode == 'multiple') {
                                opt.text.push(`<span data-value="${e.val}">${e.label}<i class="ic i_c"></i></span>`);
                                if (is_value !== true) {
                                    opt.value.push(e.val.toString());
                                }
                            } else {
                                if (e.val == in_selected) {
                                    opt.text = e.label;
                                    opt.value[0] = e.val;
                                }
                            }
                        }
                    }
                    // 图片下拉菜单
                    if (type === "img") {
                        var itemData = '';
                        $.each(e, function(itemKdy, itemVal) {
                            if (itemKdy != 'selected' && itemKdy != 'label') {
                                itemData += `data-${itemKdy==='val'?'value':itemKdy}="${itemVal}" `;
                            }
                        });
                        opt.html +=
                            `<li class="slt_item${e.val} ${e.val == in_selected?'active':''}" ${itemData}>
                            <span>
                                <img src="${url+e.label}.png" alt="${e.label}">
                            </span>
                        </li>`;
                        // 设置默认选中的值
                        if (e.val == in_selected) {
                            opt.text = `<img src="${url+e.label}.png" alt="${e.label}">`;
                            opt.value[0] = e.val;
                        }
                    }
                }

                // 树下拉菜单
                if (type === "tree") {
                    // 遍历一级节点``
                    let specify = settings.specify ? settings.specify : {},
                        name_1 = specify.name ? e[specify.name.one_name] : e.name,
                        text_1 = $('<span class="text" />').text(name_1),
                        id_1 = specify.value ? e[specify.value.one_value] : e.id ? e.id : '';
                    var item_1,
                        e_val;
                    if (revert === 'id') {
                        item_1 = $(`<li class="tree_item selected_${id_1}" data-tid="${idx}" data-id="${id_1}"/>`);
                    } else {
                        e_val = JSON.parse(JSON.stringify(e));
                        delete e_val['children'];
                        item_1 = $(`<li class="tree_item selected_${id_1}" data-tid="${idx}" data-id="${id_1}" data-array='${JSON.stringify(e_val)}'/>`);
                    }
                    if (is_value === true) {
                        if (subset === -1 || subset === 1) {
                            let in_val_1 = $.inArray(id_1.toString(), opt.value);
                            if (mode === 'multiple' && in_val_1 !== -1) {
                                item_1.addClass('active');
                                opt.text.push(`<span data-value="${id_1}">${name_1}<i class="ic i_c"></i></span>`);
                            }
                            if (mode === 'single' && in_val_1 !== -1 && in_selected === null) {
                                item_1.addClass('active');
                                opt.text.push(name_1);
                                opt.value[0] = id_1;
                                in_selected = true;
                            }
                        }
                    } else {
                        if (subset === -1 || subset === 1) {
                            if (e.checked && e.checked !== undefined && mode === 'multiple') {
                                item_1.addClass('active');
                                opt.text.push(`<span data-value="${id_1}">${name_1}<i class="ic i_c"></i></span>`);
                                opt.value.push(id_1)
                            }
                            if (e.checked && e.checked !== undefined && mode === 'single' && in_selected === null) {
                                item_1.addClass('active');
                                opt.text.push(name_1);
                                if (revert === 'id') {
                                    opt.value[0] = id_1;
                                } else {
                                    opt.value[0] = e_val;
                                }
                                in_selected = true;
                            }
                        }
                    }
                    if (e.children) {
                        opt.html.append(item_1.append(more_ic, text_1));
                        var cont_2 = $(`<div class="tree_content swt_${idx}" />`),
                            tree_list_2 = $(`<ul class="m_list_tree m_list_more ${subset === 2?'subset_'+subset:''}" />`);
                        // 遍历二级节点
                        e.children.map(function(e_2, idx_2) {
                            let name_2 = specify.name ? e_2[specify.name.two_name] : e_2.name,
                                text_2 = $('<span class="text" />').text(name_2),
                                id_2 = specify.value ? e_2[specify.value.two_value] : e_2.id ? e_2.id : '';
                            var item_2,
                                e2_val;
                            if (revert === 'id') {
                                item_2 = $(`<li class="tree_item selected_${id_2}" data-id="${id_2}" data-tid="${idx + '_' + idx_2}"/>`);
                            } else {
                                e2_val = JSON.parse(JSON.stringify(e_2));
                                delete e2_val['children'];
                                item_2 = $(`<li class="tree_item selected_${id_2}" data-id="${id_2}" data-tid="${idx + '_' + idx_2}" data-array='${JSON.stringify(e2_val)}'/>`);
                            }
                            if (is_value === true) {
                                if (subset === -1 || subset === 2) {
                                    let in_val_1 = $.inArray(id_2.toString(), opt.value);
                                    if (mode === 'multiple' && in_val_1 !== -1) {
                                        item_2.addClass('active');
                                        opt.text.push(`<span data-value="${id_2}">${name_2}<i class="ic i_c"></i></span>`);
                                    }
                                    if (mode === 'single' && in_val_1 !== -1 && in_selected === null) {
                                        item_2.addClass('active');
                                        opt.text.push(name_2);
                                        opt.value[0] = id_2;
                                        in_selected = true;
                                    }
                                }
                            } else {
                                if (subset === -1 || subset === 2) {
                                    if (e_2.checked && e_2.checked !== undefined) {
                                        if (mode === 'multiple') {
                                            item_2.addClass('active');
                                            opt.text.push(`<span data-value="${id_2}">${name_2}<i class="ic i_c"></i></span>`);
                                            opt.value.push(id_2)
                                        }
                                        if (mode === 'single' && in_selected === null) {
                                            item_2.addClass('active');
                                            opt.text.push(name_2);
                                            if (revert === 'id') {
                                                opt.value[0] = id_2;
                                            } else {
                                                opt.value[0] = e2_val;
                                            }
                                            in_selected = true;
                                        }
                                    }
                                }
                            }
                            if (e_2.children) {
                                tree_list_2.append(item_2.append(more_ic, text_2));
                                var cont_3 = $(`<div class="tree_content swt_${idx + '_' + idx_2}" />`),
                                    tree_list_3 = $(`<ul class="m_list_tree m_list_more ${subset === 3?'subset_'+subset:''}" />`);
                                // 遍历三级节点
                                e_2.children.map(function(e_3, idx_3) {
                                    let name_3 = specify.name ? e_3[specify.name.three_name] : e_3.name,
                                        text_3 = $('<span class="text" />').text(name_3),
                                        id_3 = specify.value ? e_3[specify.value.three_value] : e_3.id ? e_3.id : '';
                                    var item_3;
                                    if (revert === 'id') {
                                        item_3 = $(`<li class="tree_item selected_${id_3}" data-tid="${idx + '_' + idx_2 + '_' + idx_3}" data-id="${id_3}"/>`);
                                    } else {
                                        item_3 = $(`<li class="tree_item selected_${id_3}" data-tid="${idx + '_' + idx_2 + '_' + idx_3}" data-id="${id_3}" data-array='${JSON.stringify(e_3)}'/>`);
                                    }
                                    if (is_value === true) {
                                        if (subset === -1 || subset === 3) {
                                            let in_val_1 = $.inArray(id_3.toString(), opt.value);
                                            if (mode === 'multiple' && in_val_1 !== -1) {
                                                item_3.addClass('active');
                                                opt.text.push(`<span data-value="${id_3}">${name_3}<i class="ic i_c"></i></span>`);
                                            }
                                            if (mode === 'single' && in_val_1 !== -1 && in_selected === null) {
                                                item_3.addClass('active');
                                                opt.text.push(name_3);
                                                opt.value[0] = id_3;
                                                in_selected = true;
                                            }
                                        }
                                    } else {
                                        if (subset === -1 || subset === 3) {
                                            if (e_3.checked && e_3.checked !== undefined) {
                                                if (mode === 'multiple') {
                                                    item_3.addClass('active');
                                                    opt.text.push(`<span data-value="${id_3}">${name_3}<i class="ic i_c"></i></span>`);
                                                    opt.value.push(id_3)
                                                }
                                                if (mode === 'single' && in_selected === null) {
                                                    item_3.addClass('active');
                                                    opt.text.push(name_3);
                                                    if (revert === 'id') {
                                                        opt.value[0] = id_3;
                                                    } else {
                                                        opt.value[0] = JSON.stringify(e_3);
                                                    }
                                                    in_selected = true;
                                                }
                                            }
                                        }
                                    }
                                    tree_list_3.append(item_3.append(text_3));
                                })
                                tree_list_2.append(cont_3.append(tree_list_3));
                            } else {
                                tree_list_2.append(item_2.append(text_2));
                            }
                        })
                        opt.html.append(cont_2.append(tree_list_2));
                    } else {
                        opt.html.append(item_1.append(text_1));
                    }
                }
            })
            return opt;
        }
    };
    // 事件
    var Binds = {
        // 初始化事件
        bind: function($plutinHtml, settings) {
            let self = this;
            if (!$plutinHtml.is('.stop_slt')) {
                // 点击空白处隐藏
                $(document).on('click', 'body', function(event) {
                    if ($(event.target).parents('.m_dropdown').length <= 0) {
                        Binds.close($plutinHtml);
                    }
                });
                // 事件
                $plutinHtml.children('.text').off('mousedown.switch').on('mousedown.switch', { settings: settings }, self.dropdown_mousedown);
                self.item_mousedown($plutinHtml, settings);
                // 调用多选删除
                if (settings.mode == 'multiple') {
                    self.multi_event($plutinHtml, settings);
                }
            }
        },
        // 展开与收缩
        dropdown_mousedown: function(e) {
            let t = $(this).parent(),
                settings = e.data.settings;;
            // 判断是否是删除图标
            if (!$(event.target).hasClass('ic')) {
                if (t.hasClass('active')) {
                    Binds.close(t);
                } else {
                    Binds.open(t, settings);
                }
            }
        },
        // 展开
        open: function($target, settings) {
            let self = this;
            $('.m_dropdown').removeClass('active').css('z-index', '10');
            $target.addClass('active').css('z-index', '30');

            // N秒后自动关闭下拉菜单
            if (settings.hide > 0) {
                setTimeout(function() {
                    self.close($target);
                }, settings.hide * 1000);
            }
        },
        // 收缩
        close: function($target) {
            $target.removeClass('active').css('z-index', '10');
        },
        // 树的展开与收缩
        tree_shrink: function($target) {
            $target.children('.tree_list').find('.more_ic').off('mousedown.icon');
            $target.children('.tree_list').on('mousedown.icon', '.more_ic', function() {
                var t = $(this),
                    tid = t.parent().data('tid');
                $('.swt_' + tid).toggle(240, 'swing', function() {
                    if (t.hasClass('active')) {
                        t.removeClass('active');
                        t.addClass('no_active'); //收缩动画
                    } else {
                        t.addClass('active'); //展开动画
                        t.removeClass('no_active');
                    }
                })
            })
        },
        // 多选删除
        multi_event: function($select, settings) {
            let self = this;
            $select.children('.text').find('.ic').off('click.text');
            $select.children('.text').on('click.text', '.ic', function(event) {
                let t = $(this),
                    val = t.parent().data('value');
                //移除当前
                t.parent().remove();

                // 内容是否为空
                if ($select.children('.text').children().length <= 0) {
                    $select.children('.text').addClass('tips').html(settings.tips);
                }

                // 移出下拉列表,计算下拉列表的位置
                if (settings.type === "tree") {
                    $select.find('.selected_' + t.parent().data('value')).removeClass('active');
                    $select.find('.tree_list').css('top', $select.children('.text').height() + 10);
                } else {
                    $select.find('.slt_list .slt_item' + val).removeClass('active');
                    $select.find('.slt_list').css('top', $select.children('.text').height() + 10);
                }

                // 移出input值
                let ipt_val = $select.find('input').val().split(','),
                    in_val = $.inArray(val.toString(), ipt_val);
                ipt_val.splice(in_val, 1);
                $select.find('input').val(ipt_val);
                // 返回值事件
                $(document).trigger('select:' + settings.class, $select.find('input').val());
            });
        },
        // 列表选中
        item_mousedown: function($select, settings) {
            let self = this;
            // 下拉列表选中
            var opt = {
                value: [],
                html: []
            }
            if ($select.data('type') === "tree") {
                // 树下拉的展开与收缩
                self.tree_shrink($select);
                // 列表点击
                $select.children('.tree_list').off('mousedown.item').on('mousedown.item', '.tree_item', function() {
                    let t = $(this),
                        m = t.parents('.m_dropdown'),
                        ipt = m.find(`input`),
                        t_text = t.children().text();

                    // 确定树下拉是否限定点击级数
                    if (settings.subset > 0 && !t.parent().hasClass(`subset_${settings.subset}`)) {
                        Binds.close($select);
                        return;
                    }

                    // 防止冒泡到展开按钮
                    if (!$('.more_ic').is(event.target) && $('.more_ic').has(event.target).length === 0) {
                        // 是否多选
                        if (settings.mode === 'multiple') {
                            let t_id = t.data('id').toString();
                            // 获取input值并去空
                            opt.value = ipt.attr('value').split(',').filter(s => $.trim(s).length > 0);

                            // 获取选中的值
                            var label_html = [];
                            m.children('.text').find('span').each(function(idx, el) {
                                label_html.push(el.outerHTML)
                            })
                            opt.html = label_html;

                            // 判断当前value是否存在
                            let is_value = $.inArray(t_id, opt.value);
                            if (is_value === -1) {
                                opt.value.push(t_id);
                                opt.html.push(`<span data-value="${t_id}">${t_text}<i class="ic i_c"></i></span>`);
                                t.addClass('active');
                            } else {
                                opt.value.splice(is_value, 1);
                                opt.html.splice(is_value, 1);
                                t.removeClass('active');
                            }
                        } else {
                            $select.find('.tree_item').removeClass('active');
                            t.addClass('active');
                            // 返回数据类型
                            if (settings.revert === "array") {
                                opt.value = t.data('array');
                            } else {
                                opt.value = t.data('id');
                            }
                            opt.html = t.find('.text').html();
                            Binds.close(m);
                        }
                        // 设置选中值与value
                        if (opt.html.length <= 0) {
                            m.children('.text').addClass('tips').html(settings.tips);
                        } else {
                            m.children('.text').removeClass('tips').html(opt.html);
                        }
                        ipt.val(JSON.stringify(opt.value));

                        // 自动计算下拉列表的位置
                        m.find('.tree_list').css('top', m.children('.text').height() + 10);

                        // 返回当前值
                        $(document).trigger('select:' + settings.class, ipt.val());

                        // 如果返回是数组，清空input
                        if (settings.revert === "array") {
                            ipt.val('');
                        }
                    }
                })
            } else {
                $select.children('.slt_list').children().off('mousedown.item');
                $select.children('.slt_list').on('mousedown.item', 'li', function(e) {
                    let t = $(this),
                        m = t.parents('.m_dropdown'),
                        ipt = m.find(`input`),
                        t_val = t.data('value').toString(),
                        t_text = $select.data('type') === "img" ? t.children().html() : t.children().text();
                    // 是否多选
                    if (settings.mode == 'multiple' && settings.type !== "img") {
                        // 获取input值并去空
                        opt.value = ipt.attr('value').split(',').filter(s => $.trim(s).length > 0);
                        // 获取选中的值
                        var label_html = [];
                        m.find('.text span').each(function(idx, el) {
                            label_html.push(el.outerHTML)
                        })
                        opt.html = label_html;

                        // 判断当前value是否存在
                        let is_value = $.inArray(t_val, opt.value);
                        if (is_value === -1) {
                            opt.value.push(t_val);
                            opt.html.push(`<span data-value="${t_val}">${t_text}<i class="ic i_c"></i></span>`);
                            t.addClass('active');
                        } else {
                            opt.value.splice(is_value, 1);
                            opt.html.splice(is_value, 1);
                            t.removeClass('active');
                        }
                    } else {
                        m.find('.slt_list').children().removeClass('active');
                        t.addClass('active');
                        opt.value = t_val;
                        opt.html = t_text;
                        Binds.close(m);
                    }

                    // 设置选中值与value
                    if (opt.html.length <= 0) {
                        m.children('.text').addClass('tips').html(settings.tips);
                    } else {
                        m.children('.text').removeClass('tips').html(opt.html);
                    }
                    ipt.val(opt.value);

                    // 自动计算下拉列表的位置
                    m.find('.slt_list').css('top', m.find('.text').height() + 10);
                    // 返回当前值（判断是否返回自定义属性）
                    if (settings.revert == "array" && t.data('array')) {
                        $(document).trigger('select:' + settings.class, t.data('array'));
                    } else {
                        $(document).trigger('select:' + settings.class, ipt.val());
                    }
                });
            }
        }
    }
    // 方法操作
    var Methods = {
        // 初始化
        init: function(opts) {
            var settings = $.extend(true, {}, Data.defaults, opts);
            var $original = $(this);
            if (Engine.controlTarget($original, ['isSelect'])) {
                return Engine.initialize($original, settings);
            }
        },
        // 设置
        set: function(data) {
            if (Engine.controlTarget(this, ['isSingle', 'isInitialized'])) {
                if (Engine.controlValues(this, data)) {
                    return Engine.setSelect(this, data);
                }
            }
        },
        // 设置选中
        setValue: function(data) {
            if (Engine.controlTarget(this, ['isSingle', 'isInitialized'])) {
                if (Engine.controlValues(this, data)) {
                    return Engine.setSelectValue(this, data);
                }
            }
        }
    }
    // 使用插件
    $.fn.DropDown = function(options) {
        if (this.length < 1) { return; }
        // 判断是什么操作
        if (Methods[options]) {
            // 传入进来的具有length属性的第一个参数arguments转换为数组，再调用它的slice（截取）方法
            var slicedArguments = Array.prototype.slice.call(arguments, 1);
            return Methods[options].apply(this, slicedArguments);
        } else if (typeof options === 'object' || !options) {
            return Methods.init.apply(this, arguments);
        } else {
            console.error('DropDown | Call error');
            console.log(this);
        }
    };

})(jQuery, window, document);