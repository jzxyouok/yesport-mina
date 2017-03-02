var url = require('url');
var qs = require('querystring');
var fs = require('fs')
var express = require('express');
var app = express();

var get_param = function(req) {
	return qs.parse(url.parse(req.url).query);
};

app.get('/', function(req, res){
	res.send('<img src="https://github.com/oikewll/yesport-mina/raw/master/qrcode-1m.jpg">');
});

/*
	读本地文件返回数据
*/
app.get('/api', function(req, res) {
	var type = get_param(req).type || 'index';
	var data = JSON.parse(fs.readFileSync('./data-'+type+'.js'))

	res.type('json'); 

	//详情的时候只拉取cid字段
	if (get_param(req).cid && get_param(req).type === 'detail'){
		var cid = get_param(req).cid;
		res.send(data[cid]);
	}else{
		res.send(data);
	}

});

/*
	邮箱列表
*/
var datafile = './mailist.db';
var data = null;

// 从本地读取数据
try {
	if (fs.existsSync(datafile)) {
		data = JSON.parse(fs.readFileSync(datafile));
	}
} catch (ex) {
	console.error('read cache error', ex);
}

// 本地没有数据文件
if (!data || !Array.isArray(data)) {
	data = [];
}
app.get('/email', function(req, res){
	var param = get_param(req);

	if (param.email && param.type === 'setemail') {
		var o = {
			'email' : param.email,
			'time' : param.time
		}

		data.push(o);

		try {
			fs.writeFileSync(datafile, JSON.stringify(data));

			res.status(200).send('{"ok":"ok!"}');
		} catch (ex) {
			console.warn('save data error', ex);
		}

	}else if(param.type && param.type === 'getemail'){
		var df = JSON.parse(fs.readFileSync(datafile));
		res.send(df);
	}
});

app.get('/file', function(req, res){

	fs.readdir('./', function(err,files){
		if(err){
			console.log("error:\n"+err);
			return;
		}

		res.send(files);

		files.forEach(function(file){
			fs.stat("/"+file,function(err,stat){
				if(err){
					console.log(err);
					return;
				}

				if(stat.isDirectory()){
				}else{
				}
						
			});
		});

	});
}).listen(3002, '127.0.0.1');

