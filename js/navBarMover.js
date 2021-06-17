// 鼠标滑入
function navBaronOver(ev){
    switch (ev.children[0].innerText) {
        case '产品':
            $('.navbarAlert_Product').slideDown()
            $('.navBarAlert_Service').hide()
            $('.navBarAlert_AboutUs').hide()
            
            break;
        case '服务支持':
            $('.navbarAlert_Product').hide()
            $('.navBarAlert_AboutUs').hide()
            $('.navBarAlert_Service').slideDown()
            break;
        case '关于我们':
            $('.navBarAlert_Service').hide()
            $('.navbarAlert_Product').hide()
            $('.navBarAlert_AboutUs').slideDown()
            break;
        default:
            break;
    }
}

// 鼠标滑出
function navBaronOut(index){
    var div1 = document.getElementsByClassName("navbar-Product-Bottom")[0];
    var m_move_x = window.event.pageX;   //鼠标X轴坐标
    var m_move_y = window.event.pageY;　　//鼠标Y轴坐标
    var divx1 = div1.offsetLeft;
    var divy1 = div1.offsetTop;
    var divx2 = div1.offsetLeft + div1.offsetWidth;
    var divy2 = div1.offsetTop + div1.offsetHeight;
    
    switch (index) {
        case 0:
            if( m_move_x < divx1 || m_move_x > divx2 || m_move_y < divy1 || m_move_y > divy2){
                $('.navbarAlert_Product').hide()
            }
            break;
        case 1:
            $('.navBarAlert_Service').hide()
            break;
        case 2:
            $('.navBarAlert_AboutUs').hide()
            break;
        default:
            break;
    }
}

function navBarClick(index){
    let dome = $('.navbar-Product-Top').children();
    console.log(dome)
    for (let i = 0; i < dome.length; i++) {
        if(i == index){
            $(dome[i]).addClass('navBar-Active')
        }else{
            $(dome[i]).removeClass('navBar-Active')
        }
    }
}