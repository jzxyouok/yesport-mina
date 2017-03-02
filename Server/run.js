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
})

app.listen(3002, '127.0.0.1');

