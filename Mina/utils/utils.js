function setStorage(vid){
    //传入值是001三位数字长度为cateid，需要补全默认第一个视频vid，否则就为vid
    var vid = vid.length > 3 ? vid : "2016"+vid+"001";

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

function getCate(vid){
  return vid.substring(4,7);
};

function isEmail(str){
   var re=/^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+$/;
   if (re.test(str) != true) {
       return false;
   }else{
       return true;
   }  
};

module.exports = {
  setStorage: setStorage,
  formatTime: formatTime,
  getCate: getCate,
  isEmail: isEmail
}
