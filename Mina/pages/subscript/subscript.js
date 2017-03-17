const utils = require('../../utils/utils');
const conf = require('../../utils/conf');
var app = getApp();

Page({
  data:{
      tipsTit: "留下您的邮箱，订阅到我们最新发布的更新",
      inputTxt : '',
      btntype: 'default',
      loading: false,
      disabled: false
  },
  onLoad: function(){
    var that = this;
    //调用应用实例的方法获取全局数据
    app.getUserInfo(function(userInfo){
      that.setData({
        userInfo: userInfo
      });
    });
  },
  // onHide: function(){
  //   //用户离开当前页面的时候存储已授权公开信息
  //   var userInfo = this.data.userInfo;

  //   wx.request({
  //     url: conf.apiURL,
  //     data: {
  //       'type': 'adduser',
  //       'data': userInfo
  //     },
  //     method: 'POST',
  //     success: function(res){
  //       console.log(res['data']);
  //     }
  //   })
  // },
  bindKeyInput: function(e){
    var pos = e.detail.cursor;
    var value = e.detail.value;

    if(pos !== 0){
        //输入了邮箱
        this.setData({
          btntype: 'primary'
        });
    }else{
        //没有输入，收起键盘
        // wx.hideKeyboard();
        this.setData({
          btntype: 'default'
        });
    }

    this.setData({
      inputTxt: value
    });
  },
  addemail: function(e){
    var that = this;
    if(!utils.isEmail(this.data.inputTxt)){
      //如果不是邮箱
      wx.showToast({
        title: '请输入正确邮箱!',
        mask: true,
        icon: 'loading'
      });
      
      return;
    }else{
      var that = this;

      //按钮显示loading
      that.setData({
        loading: true
      });

      var userInfo = that.data.userInfo;

      wx.request({
        url: conf.apiURL,
        data: {
          'type': 'setemail',
          'email': that.data.inputTxt,
          'openid': userInfo.openid,
          'nickname': userInfo.nickName
        },
        method: 'POST',
        success: function(res){
          if(res.data['status'] === '200'){
            //按钮显示loading
            that.setData({
              loading: !that.data.loading,
              btntype: 'default',
              disabled: true,
              inputTxt: ''
            });

            wx.showToast({
              title: '订阅成功!',
              mask: true,
              icon: 'success'
            });
          }else{
            wx.showToast({
              title: '提交失败，请再试~',
              mask: true,
              icon: 'loading'
            });
          }
        },
        fail: function() {
          // fail
        }
      });
    }
  }
})