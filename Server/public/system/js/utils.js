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
}