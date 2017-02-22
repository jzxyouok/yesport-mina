const utils = require('../../utils/utils');

Page({
  data:{
      tipsTit: "留下您的邮箱，订阅到我们最新发布的更新",
      inputTxt : '',
      btntype: 'default',
      loading: false,
      disabled: false
  },
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
        })
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

      wx.request({
        url: 'https://dev.yechtv.com/api/',
        data: {
          'type': 'setemail',
          'time': new Date().getTime(),
          'email': that.data.inputTxt
        },
        method: 'GET',
        success: function(res){
          if(res.data['status'] === '200'){
            //按钮显示loading
            that.setData({
              loading: !that.data.loading,
              btntype: 'default',
              disabled: true
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