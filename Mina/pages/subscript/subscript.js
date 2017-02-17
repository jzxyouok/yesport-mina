const utils = require('../../utils/utils');

Page({
  data:{
      tipsTit: "留下您的邮箱，订阅到我们最新发布的更新",
      inputTxt : ''
  },
  btntype: 'default',
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
    if(!utils.isEmail(this.data.inputTxt)){
      //如果不是邮箱
      wx.showToast({
        title: '请输入正确邮箱!',
        mask: true,
        icon: 'loading',
        duration: 2000
      });
      
      return;
    }
  }
})