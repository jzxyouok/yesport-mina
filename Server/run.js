var url = require('url');
var qs = require('querystring');
var request = require('request');
var fs = require('fs');
var express = require('express');
var app = express();
var path = require('path');
var swig  = require('swig');
var moment = require('moment');
var utils  = require('./utils/utils');
var FADE  = require('./utils/fadecode');//appid等重要信息

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//七牛存储API
var KEY  = require('./utils/KEY');//七牛上传的key
var qiniu = require('qiniu');
qiniu.conf.ACCESS_KEY = KEY.AK;
qiniu.conf.SECRET_KEY = KEY.SK;

var get_param = function(req) {
	return qs.parse(url.parse(req.url).query);
};

//数据库配置
var MongoClient = require('mongodb').MongoClient;
var DB_CONN_STR = FADE.database;

var insertData = function(db, collection, param, callback) {  
	//连接到表  
	var collection = db.collection(collection);
	//插入数据
	collection.insert(param, function(err, result) { 
		if(err)
		{
			console.log('Error:'+ err);
			return;
		}
		callback(result);
	});
};

var selectData = function(db, collection, callback) {
	//连接到表  
	var collection = db.collection(collection);
	//查询全部或者某个字段，去掉原生的_id字段
	collection.find({}, {_id: 0}).sort({ time : -1 }).toArray(function(err, result) {
	if(err)
	{
	  console.log('Error:'+ err);
	  return;
	}
	callback(result);
	});
};

var selectDataOne = function(db, collection, obj, callback) {
	var collection = db.collection(collection);
	collection.find(obj, {_id: 0}).toArray(function(err, result) {
		if(err){
			console.log('Error:'+ err);
			return;
		}
		callback(result);
	});
};

// This is where all the magic happens!
app.engine('html', swig.renderFile);

app.set('view engine', 'html');
app.set('views', __dirname + '/views');

app.set('port',process.env.PORT || 8001);//设置端口

//使用static中间件 public目录为静态资源目录。静态资源入口交给nginx处理
app.use('/public', express.static(__dirname + '/public'));

//上传目录处理
// app.use('/upload', express.static(__dirname + '/upload'));

app.get('/', function (req, res) {

	res.type('html').send( fs.readFileSync(__dirname + '/views/index.html') );

});

//定义参数
app.param('type', function (req, res, next, type) {
	next();
});

app.get('/video/:type', function(req, res){
	var type = req.params.type;
	if(type === 'add'){
		MongoClient.connect(DB_CONN_STR, function(err, db) {
			selectData(db, 'album', function(result) {
				var albumoption = '<select class="form-control" id="coverlist"><option selected value="-1">请选择专辑</option>';
				for (var i = 0; i < result.length; i++) {
					albumoption += '<option value="'+result[i].cid+'">'+result[i].title+'</option>';
				}
				albumoption += '</select>';

				res.render('video-add', {
					'title': '新建视频',
					'menu' : 'addvideo',
					'albumoption' : albumoption
				});

				db.close();
			});
		});
		
	}else if(type === 'get'){
		var cid = get_param(req).cid,
			vid = get_param(req).vid,
			plus = get_param(req).plus;

		MongoClient.connect(DB_CONN_STR, function(err, db) {
			if (cid) { //如果有专辑CID就拉取CID所对应的video list
				selectDataOne(db, 'video', {cid: cid}, function(result){
					res.send(result);
					db.close();
				});
			}else if(vid && plus && plus === 'album'){ //拉取单个视频以外还要所对应的专辑系列
				selectDataOne(db, 'video', {vid: vid}, function(result){
					var cid = result[0].cid;

					selectDataOne(db, 'video', {cid: cid}, function(_res){
						var obj = result[0];
							obj.albumvlist = _res;
						res.send(obj);
						db.close();
					});

				});
			}else if(vid){ //如果有单个视频VID就拉取所对应的video
				selectDataOne(db, 'video', {vid: vid}, function(result){
					res.send(result);
					db.close();
				});
			}else{
				selectData(db, 'video', function(result) {
					res.send(result);
					db.close();
				});
			}
		});
		
	}else if(type === 'list'){
		var page = get_param(req).page || 1;  //默认第一页
		var rows = 10; //每次拉取10条

		MongoClient.connect(DB_CONN_STR, function(err, db) {

			//查询全部或者某个字段
			db.collection('video').find({}, {limit:rows, skip:(page - 1) * rows}).sort({ time : -1 }).toArray(function(err, result) {

				if(err){
					console.log('Error:'+ err);
					return;
				}
				for (var i = 0; i < result.length; i++) {
					result[i]._time = moment(new Date(result[i].time)).format('YYYY-MM-DD HH:mm:ss');
				}

				db.collection('video').find().toArray(function(err, _result) {

					// var pages = '<li><a href="?page=prev">«</a></li>';
					var pages = '';
					var pagesize = Math.ceil(_result.length / rows); //总条数除以拉取总数，得到分页数

					for (var i = 0; i < pagesize; i++) {
						pages += '<li><a href="?page='+Number(i+1)+'">'+Number(i+1)+'</a></li>';
					}
					// pages += '<li><a href="?page=next">»</a></li>';

					res.render('video-manage', {
						'title': '视频管理',
						'menu' : 'videolist',
						'videolist' : result,
						'videocount' : _result.length,
						'pages' : pages
					});

					db.close();
				});

			});

		});
		
	}else if(type === 'detail'){
		var vid = get_param(req).vid;

		MongoClient.connect(DB_CONN_STR, function(err, db) {
			selectDataOne(db, 'video', {vid: vid}, function(result) {

				selectData(db, 'album', function(_result) {
					var albumoption = '<select class="form-control" id="coverlist">';
					for (var i = 0; i < _result.length; i++) {
						if (result[0].cid === _result[i].cid) {
							albumoption +='<option selected value="'+_result[i].cid+'">'+_result[i].title+'</option>';
						}else{
							albumoption +='<option value="'+_result[i].cid+'">'+_result[i].title+'</option>';
						}
					}
					albumoption += '</select>';

					result[0].catelist = albumoption;

					res.render('video-detail', {
						'title': '视频详情',
						'menu' : 'videolist',
						'result' : result[0]
					});

					db.close();
				});
			});
		});

	}
});

app.get('/album/:type', function(req, res){
	var type = req.params.type;
	if (type === 'get') {
		var cid = get_param(req).cid;

		MongoClient.connect(DB_CONN_STR, function(err, db) {
			if (cid) { //如果有专辑CID就拉取单个
				selectDataOne(db, 'album', {cid: cid}, function(result) {
					res.send(result);
					db.close();
				});
			}else{ //默认返回全部专辑信息
				db.collection("album").find().sort({ "order" : 1 }).toArray(function(err, result) {
					if(err){
					  console.log('Error:'+ err);
					  return;
					}
					res.send(result);
					db.close();
				});
			}
		});
		
	}else if(type === 'set'){
		res.render('cover-add', {
			'title': '新建专辑',
			'menu' : 'setalbum'
		});
	}else if(type === 'list'){

		MongoClient.connect(DB_CONN_STR, function(err, db) {

			// ?ac=uporder 更新专辑序列号操作
			if (get_param(req).ac && get_param(req).ac === 'uporder') {
				var order = JSON.parse(get_param(req).order);

				for (var i = 0; i < order.length; i++) {
					db.collection('album').update({cid: order[i].cid}, {$set:{'order': Number(order[i].order) }});
				}

				res.json({"status": 200});
				db.close();

			}else{
				db.collection("album").find().sort({ "order" : 1 }).toArray(function(err, result) {
					if(err){
					  console.log('Error:'+ err);
					  return;
					}
					for (var i = 0; i < result.length; i++) {
						result[i]._time = moment(new Date(result[i].time)).format('YYYY-MM-DD HH:mm:ss');
					}

					res.render('cover-list', {
						'title': '专辑管理',
						'menu' : 'albumlist',
						'albumlist' : result,
						'albumcount' : result.length
					});
					db.close();
				});
			}
			
		});
		
	}else if(type === 'detail'){
		var cid = get_param(req).cid;

		MongoClient.connect(DB_CONN_STR, function(err, db) {
			selectDataOne(db, 'album', {cid: cid}, function(result) {
				// res.send(result[0].banner)
				selectDataOne(db, 'video', {cid: cid}, function(_result) {
					res.render('cover-detail', {
						'title': '专辑详情',
						'menu' : 'albumdetail',
						'result' : result[0],
						'videolist' : _result
					});
					db.close();
				});
			});
		});

	}
});

/*
	mongod存储数据
*/
app.post('/', function(req, res){
	var param = req.body || {};

	if (param.type && param.type === 'adduser') {//存储用户授权的公开信息

		param = param.data ? param.data : {};// => userInfo or null
		param.time = Date.now();//定义一个更新时间

		MongoClient.connect(DB_CONN_STR, function(err, db) {
			selectDataOne(db, 'user', {openid: param.openid}, function(result) {
				if (result.length === 0) {
					insertData(db, 'user', param, function(_res) {
						//写入数据表成功
						res.json({"status":"200"});
						db.close();
					});
				}else{
					//数据库里面存在相同的openid，不用做任何处理
					res.json({"status":"201", "msg":"已有用户"});
					db.close();
				}
			});
			
		});

	}else if (param.type && param.type === 'setemail') {//存储emailist

		param.time = Date.now();//定义一个更新时间

		MongoClient.connect(DB_CONN_STR, function(err, db) {
			selectDataOne(db, 'mailist', {openid: param.openid}, function(result) {
				if (result.length === 0) {
					insertData(db, 'mailist', param, function(_res) {
						//写入数据表成功
						res.json({"status":"200"});
						db.close();
					});
				}else{
					//数据库里面存在相同的openid，不用做任何处理
					res.json({"status":"201", "msg":"已经提交过邮箱"});
					db.close();
				}

			});
		});

	}else if(param.type && param.type === 'getemail'){//数据库读取emailist

		MongoClient.connect(DB_CONN_STR, function(err, db) {
			selectData(db, 'mailist', function(result) {
				res.send(result);
				db.close();
			});
		});

	}else if(param.type && param.type === 'setalbum'){//存储专辑信息

		param.time = Date.now();//定义一个更新时间

		//这里定义多一个CID作为查询主键入库
		param.cid = utils.randomString(16);

		MongoClient.connect(DB_CONN_STR, function(err, db) {
			insertData(db, 'album', param, function(result) {
				//写入数据表成功
				var _res = {
					status: 'ok',
					cid: result.insertedIds[0]
				}
				res.send(_res);
				db.close();
			});
		});
	}else if(param.type && param.type === 'addvideo'){//存储视频信息

		param.time = Date.now();//定义一个更新时间
		//这里定义多一个VID作为查询主键入库
		param.vid = utils.randomString(16);
		param.playcount = Math.random() * 1000 >> 0; //随机定义一个初始播放量，你懂的 :)

		MongoClient.connect(DB_CONN_STR, function(err, db) {
			insertData(db, 'video', param, function(result) {
				//写入数据表成功
				var _res = {
					status: 'ok',
					vid: result.ops[0].vid
				}
				res.send(_res);
				db.close();
			});
		});
	}else if(param.type && param.type === 'updateVideo'){//更新视频信息

		param.time = Date.now();//定义一个更新时间
		
		MongoClient.connect(DB_CONN_STR, function(err, db) {
			db.collection('video').update({vid: param.vid}, param);

			//写入数据表成功
			var _res = {
				status: 'ok',
				type: 'updateVideo'
			}
			res.send(_res);
			db.close();
		});
	}else if(param.type && param.type === 'updateAlbum'){//更新专辑信息

		param.time = Date.now();//定义一个更新时间
		param.order = Number(param.order); //序列号float
		
		MongoClient.connect(DB_CONN_STR, function(err, db) {
			db.collection('album').update({cid: param.cid}, param);

			//写入数据表成功
			var _res = {
				status: 'ok',
				type: 'updateAlbum'
			}
			res.send(_res);
			db.close();
		});
	}else if(param.openid && param.type === 'prossup'){//用户关闭页面，remote更新用户观看历史记录和用户收藏列表

		var hisArr = JSON.parse(param.hisArr),
			collectArr = JSON.parse(param.collectArr),
			time = Date.now();
		
		MongoClient.connect(DB_CONN_STR, function(err, db) {
			//更新观看历史记录
			db.collection('history').update({ openid: param.openid }, {$set:{'data': hisArr, 'time': time} });
			//更新收藏列表
			db.collection('collect').update({ openid: param.openid }, {$set:{'data': collectArr, 'time': time} });

			res.json({'status': '200'});
			db.close();
		});
	}
});

app.get('/uptoken', function(req, res){
	var myUptoken = new qiniu.rs.PutPolicy(FADE.buket);
    var token = myUptoken.token();
    // moment.locale('en');
    // var currentKey = moment(new Date()).format('YYYY-MM-DD-HH:mm:ss');
    res.header("Cache-Control", "max-age=0, private, must-revalidate");
    res.header("Pragma", "no-cache");
    res.header("Expires", 0);
    if (token) {
        res.json({
            uptoken: token
        });
    }
});

// 持久化数据处理，对已有key的文件做处理，可以对视频转码、截图(有坑)
/*
	cmd参数：
	视频在7秒的时候截图——'vframe/jpg/offset/7/w/260/h/150'
*/
app.get('/pfop', function(req, respon){
	var param = get_param(req),
		cmd = param.cmd,
		key = param.key;

	var opts = {};

	qiniu.fop.pfop(FADE.buket, key, cmd, opts, function(err, ret, res) {
		if (res.statusCode == 200) {
			respon.send(res);

	    } else {
			respon.send(err);
	    }
	});

});

app.get('/file', function(req, res){

	fs.readdir('./', function(err,files){
		if(err){
			console.log("error:\n"+err);
			return;
		}

		res.send(files);

		files.forEach(function(file){
			fs.stat("/"+file, function(err,stat){
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

//获取用户openid
app.get('/onLogin', function(req, res){
	var code = get_param(req).code;
	var url = 'https://api.weixin.qq.com/sns/jscode2session?appid='+FADE.appid+'&secret='+FADE.secret+'&js_code='+code+'&grant_type=authorization_code'
	request(url, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			res.send(body);
		}
	})
});

app.listen(app.get('port'), function () {
    console.log( '服务器启动完成，端口为： '+app.get('port') );
});

