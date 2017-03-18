const conf = require('./conf');

function getLocalHis(array){
    var storArray = array.reverse();//按时间倒序排列记录
    var albumListData = wx.getStorageSync('albumListData') || [];
    var arr = [];

    for(var i = 0;i < storArray.length;i++){
      var curVid = storArray[i].vid;
      var o = {};

      for(var j = 0;j < albumListData.length;j++){
        
        for(var k = 0;k < albumListData[j]['data'].length;k++){
          if(albumListData[j]['data'][k].vid === curVid){
            o.vid = albumListData[j]['data'][k].vid;
            o.imgurl = albumListData[j]['data'][k].imgurl;
            o.title = albumListData[j]['data'][k].title;
            o.time = timeFormat(storArray[i].time);
            arr.push(o);
          }
        }

      }
    }
    return unique(arr);
  };

//存储专辑信息
function setAlbumList(cid, data){
    var time = new Date().getTime();
    var albumDataArr = wx.getStorageSync('albumListData') ? wx.getStorageSync('albumListData') : [],
        obj = {};
        obj.cid = cid;
        obj.data = data;
      albumDataArr.push(obj);
    var _arr = uniqueCID(albumDataArr);

      wx.setStorageSync('albumListData', _arr);
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

//用户关闭或者离开当前页面onHide/onUnload 的时候触发，把用户资料和本地数据更新到接口
function upRemoteData(userInfo, cb){
    var collectArr = wx.getStorageSync('likelist') ? wx.getStorageSync('likelist') : [];
    var hisArr = wx.getStorageSync('historyStor') ? wx.getStorageSync('historyStor') : [];

      //历史记录、收藏记录
      wx.request({
        url: conf.apiURL,
        data: {
          'openid': userInfo.openid,
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

      //用户信息，如果有添加过的会返回201状态值
      wx.request({
        url: conf.apiURL,
        data: {
          'type': 'adduser',
          'data': userInfo
        },
        method: 'POST',
        success: function(res){
          console.log(res['data']);
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

function uniqueCID(array){
  var r = [];
  for(var i = 0, l = array.length; i < l; i++) {
    for(var j = i + 1; j < l; j++)
      if (array[i].cid === array[j].cid) j = ++i;
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

function numconvert(nStr){
    var nStr = Number(nStr);
        nStr += ''; 
    var x = nStr.split('.'),
        x1 = x[0],
        x2 = x.length > 1 ? '.' + x[1] : ''; 
    var rgx = /(\d+)(\d{3})/; 
    while (rgx.test(x1)) { 
      x1 = x1.replace(rgx, '$1' + ',' + '$2'); 
    } 
    return x1 + x2;  
};

module.exports = {
  getLocalHis: getLocalHis,
  setStorage: setStorage,
  formatTime: formatTime,
  isEmail: isEmail,
  timeFormat: timeFormat,
  likeStatus: likeStatus,
  reqLikeSt: reqLikeSt,
  upRemoteData: upRemoteData,
  setAlbumList: setAlbumList,
  unique: unique,
  numconvert: numconvert
}
