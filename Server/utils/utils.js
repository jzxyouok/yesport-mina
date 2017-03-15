var timeFormat = function(time){
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

function randomString(len) {
　　len = len || 32;
　　var $chars = new Date().getTime()+'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz';    /****默认去掉了容易混淆的字符oOLl,9gq,Vv,Uu,I1****/
　　var maxPos = $chars.length;
　　var pwd = '';
　　for (i = 0; i < len; i++) {
	pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
　　}
　　return pwd;
};

//时间秒数格式化
function timer_format(s) {
	var t, s = Math.ceil(s);
	if(s > -1){
		hour = Math.floor(s / 3600);
		min = Math.floor(s / 60) % 60;
		sec = s % 60;
		day = parseInt(hour / 24);
		if (day > 0) {
			hour = hour - 24 * day;
			t = day + "day " + hour + ":";
			}
		else t = hour + ":";   
		if(min < 10){t += "0";}
			t += min + ":";
		if(sec < 10){t += "0";}
			t += sec;
	}
	return t;
}

module.exports = {
  timeFormat: timeFormat,
  randomString: randomString,
  timer_format: timer_format
}