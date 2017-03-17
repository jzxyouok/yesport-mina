//存储专辑信息
function setAlbumList(cid, data){
    var time = new Date().getTime();
    var albumDataArr = wx.getStorageSync('albumListData') ? wx.getStorageSync('albumListData') : [];
    
    if(detectSame(cid, albumDataArr) !== 'yes'){
      var obj = {};
          obj.cid = cid;
          obj.data = data;
      albumDataArr.push(obj);

      wx.setStorageSync('albumListData', albumDataArr);
    }
};

function detectSame(cid, array){
  for(var i = 0;i < array.length;i++){
    if(array[i]['cid'] === cid){
      return 'yes';
    }
  }
};

//更新历史观看记录
function setStorage(vid){
    var time = new Date().getTime(),
        obj = {};

    wx.getStorage({
      key: "historyStor",
      success: function(res){
        var historyStor = res.data;
        //push后再去重
        obj.vid = vid;
        obj.time = time;

        historyStor.push(obj);
        var nh = unique(historyStor);

        wx.setStorage({
          key: 'historyStor',
          data: nh
        });
      },
      fail: function(res){
        //如果没有找到本地缓存，就新建一个数组对象存储vid
        var historyStor = [];
        obj.vid = vid;
        obj.time = time;
        historyStor.push(obj);

        wx.setStorage({
          key: 'historyStor',
          data: historyStor
        });
      }
    });
};

//用户关闭或者离开当前页面onHide/onUnload 的时候触发，把openid和data更新到接口
function upRemoteData(openid, cb){
    var collectArr = wx.getStorageSync('likelist') ? wx.getStorageSync('likelist') : [];
    var hisArr = wx.getStorageSync('historyStor') ? wx.getStorageSync('historyStor') : [];

      wx.request({
        url: conf.apiURL,
        data: {
          'openid': openid,
          'type': 'prossup',
          'hisArr': JSON.stringify(hisArr),
          'collectArr': JSON.stringify(collectArr)
        },
        method: 'POST',
        success: function(res){
          typeof cb == "function" && cb(res.data);
        },
        fail: function(res) {
          typeof cb == "function" && cb(res.data);
        }
      });

};

function formatTime(date) {
  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var day = date.getDate()

  var hour = date.getHours()
  var minute = date.getMinutes()
  var second = date.getSeconds()


  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
};

function formatNumber(n) {
  n = n.toString()
  return n[1] ? n : '0' + n
};

function unique(array){
  var r = [];
  for(var i = 0, l = array.length; i < l; i++) {
    for(var j = i + 1; j < l; j++)
      if (array[i].vid === array[j].vid) j = ++i;
    r.push(array[i]);
  }
  return r;
};

function isEmail(str){
   var re=/^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+$/;
   if (re.test(str) != true) {
       return false;
   }else{
       return true;
   }  
};

function timeFormat(time){
  var date = new Date(time)
    , curDate = new Date()
    , year = date.getFullYear()
    , month = date.getMonth() + 1
    , day = date.getDate()
    , hour = date.getHours()
    , minute = date.getMinutes()
    , curYear = curDate.getFullYear()
    , curHour = curDate.getHours()
    , timeStr;

  if(year < curYear){
    timeStr = year +'年'+ month +'月'+ day +'日 '+ hour +':'+ minute;
  }else{
    var pastTime = curDate - date
      , pastH = pastTime/3600000;

    if(pastH > curHour){
      timeStr = month +'月'+ day +'日 '+ hour +':'+ minute;
    }else if(pastH >= 1){
      timeStr = '今天 ' + hour +':'+ minute;
    }else{
      var pastM = curDate.getMinutes() - minute;
      if(pastM > 1){
        timeStr = pastM +'分钟前';
      }else{
        timeStr = '刚刚';
      }
    }
  }

  return timeStr;
};

function reqLikeSt(keyname, vid, callback){
  if(wx.getStorageSync(keyname)){
    var likelist = wx.getStorageSync(keyname);

    if('liked' === likeStatus(vid, likelist)){
      callback();
    }

  }
};

function likeStatus(vid, array){
  for(var i = 0;i < array.length;i++){
    if(array[i]['vid'] === vid){
      return 'liked';
    }
  }
};

module.exports = {
  setStorage: setStorage,
  formatTime: formatTime,
  isEmail: isEmail,
  timeFormat: timeFormat,
  likeStatus: likeStatus,
  reqLikeSt: reqLikeSt,
  upRemoteData: upRemoteData,
  setAlbumList: setAlbumList,
  unique: unique
}
