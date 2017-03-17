const conf = require('./utils/conf');

App({
  getUserInfo: function(cb){
    var that = this;
    if(this.globalData.userInfo){
      typeof cb == "function" && cb(this.globalData.userInfo)
    }else{
      //调用登录接口
      wx.login({
        success: function (loginRes) {

          wx.getUserInfo({
            success: function (res) {

                //请求用户openid
                wx.request({
                  url: conf.apiURL+'/onLogin',
                  data: {
                    code: loginRes.code
                  },
                  success: function(openidRes){
                    if (!openidRes['data']['errcode']) {
                      //新增一个openid对象构造新的userInfo
                      res.userInfo.openid = openidRes['data']['openid']

                      that.globalData.userInfo = res.userInfo;

                      typeof cb == "function" && cb(that.globalData.userInfo)
                    }else{
                      //错误session过期
                      console.log(openidRes['data']['errmsg']);
                    }
                  }
                });
                
            }
          })

        }
      });
    }
  },
  globalData:{
    userInfo: null,
  }
})