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
	randomString: randomString,
	timer_format: timer_format
}