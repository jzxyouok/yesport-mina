var url = require('url');
var qs = require('querystring');
var fs = require('fs')
var express = require('express');
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var get_param = function(req) {
	return qs.parse(url.parse(req.url).query);
};

//数据库配置
var MongoClient = require('mongodb').MongoClient;
var DB_CONN_STR = 'mongodb://localhost:27017/yechtv';
var DBNAME = 'mailist'; //数据库表名

app.set('port',process.env.PORT || 8001);//设置端口

//使用static中间件 public目录为静态资源目录
app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {

	// if(get_param(req).type && get_param(req).type === 'mailform'){
	// 	res.type('html').send( fs.readFileSync(__dirname + '/views/email.html') );
	// }else{
		res.type('html').send( fs.readFileSync(__dirname + '/views/index.html') );
	// }
});

/*
	邮箱列表，mongod存储数据
*/
app.post('/', function(req, res){
	var param = req.body

	if (param.email && param.type === 'setemail') {//写入数据库

		try {
			var insertData = function(db, callback) {  
				//连接到表  
				var collection = db.collection(DBNAME);
				//插入数据
				collection.insert(param, function(err, result) { 
					if(err)
					{
						console.log('Error:'+ err);
						return;
					}
					callback(result);
				});
			}

			MongoClient.connect(DB_CONN_STR, function(err, db) {
				console.log("连接成功！");
				insertData(db, function(result) {
					//写入数据表成功
					res.send('{"status":"200"}');
					db.close();
				});
			});

		} catch (ex) {
			console.warn('save data error', ex);
		}

	}else if(param.type && param.type === 'getemail'){//数据库提取资料

		var selectData = function(db, callback) {
		  //连接到表  
		  var collection = db.collection(DBNAME);
		  //查询全部
		  collection.find().toArray(function(err, result) {
			if(err)
			{
			  console.log('Error:'+ err);
			  return;
			}     
			callback(result);
		  });
		}

		MongoClient.connect(DB_CONN_STR, function(err, db) {
		  console.log("连接成功！");
		  selectData(db, function(result) {
			res.send(result);
			db.close();
		  });
		});
	}
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
});

app.listen(app.get('port'), function () {
    console.log( '服务器启动完成，端口为： '+app.get('port') );
});

