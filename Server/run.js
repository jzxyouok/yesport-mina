var url = require('url'),
	qs = require('querystring'),
	request = require('request'),
	fs = require('fs'),
	express = require('express'),
	app = express(),
	path = require('path'),
	swig  = require('swig'),
	moment = require('moment'),
	utils  = require('./utils/utils'),
	FADE  = require('./utils/fadecode');//appid等重要信息

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
				var albumoption = '<select class="form-control" id="coverlist"><option selected value="-1">请选择专辑</option>',
					arr = [{"pr":"——","sp":"——"}];
				for (var i = 0; i < result.length; i++) {
					albumoption += '<option value="'+result[i].cid+'">'+result[i].title+'</option>';
					var obj = {};
					obj.pr = result[i].production;
					obj.sp = result[i].sponsor;
					arr.push(obj);
				}
				albumoption += '</select>';

				res.render('video-add', {
					'title': '新建视频',
					'menu' : 'addvideo',
					'albumoption' : albumoption,
					'optionTab' : JSON.stringify(arr)
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

/*专辑管理*/
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

					var arr = result;
					db.collection("video").aggregate([{$group : {_id : "$cid", playcount : {$sum : "$playcount"}}}]).toArray(function(err, _res){
						// 计算每个专辑里面对应的视频播放量
						for (var i = 0; i < arr.length; i++) {
							for (var k = 0; k < _res.length; k++) {
								if (arr[i].cid === _res[k]['_id']) {
									arr[i].playcount = _res[k].playcount;
								}
							}
						}
						res.send(arr);
						db.close();
					});

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

/*用户管理*/
app.get('/user/:type', function(req, res){
	var type = req.params.type;
	if(type === 'list'){

		MongoClient.connect(DB_CONN_STR, function(err, db) {
			selectData(db, 'user', function(result) {
				for (var i = 0; i < result.length; i++) {
					result[i]._time = moment(new Date(result[i].time)).format('YYYY-MM-DD HH:mm:ss');
				}

				res.render('user-list', {
					'title': '用户列表',
					'menu' : 'userlist',
					'userlist' : result,
					'ucounts' : result.length
				});
				db.close();
			});
		});
		
	}else if(type === 'detail'){
		var openid = get_param(req).openid;

		MongoClient.connect(DB_CONN_STR, function(err, db) {
			selectDataOne(db, 'user', {openid: openid}, function(result) {
				res.send(result);
				db.close();
			});
		});
	}else if (type === 'email') {

		MongoClient.connect(DB_CONN_STR, function(err, db) {
			selectData(db, 'mailist', function(result) {
				for (var i = 0; i < result.length; i++) {
					result[i]._time = moment(new Date(result[i].time)).format('YYYY-MM-DD HH:mm:ss');
				}

				res.render('email-list', {
					'title': '订阅邮箱列表',
					'menu' : 'emailist',
					'mailist' : result,
					'ucounts' : result.length
				});
				db.close();
			});
		});
	}
});

/*用户管理*/
app.get('/artist/:type', function(req, res){
	var type = req.params.type;

	if(type === 'add'){

		res.render('artist-add', {
			'title': '添加艺人',
			'menu' : 'artistadd'
		});
		
	}else if(type === 'list'){

		MongoClient.connect(DB_CONN_STR, function(err, db) {
			selectData(db, 'artist', function(result) {
				for (var i = 0; i < result.length; i++) {
					result[i]._time = moment(new Date(result[i].time)).format('YYYY-MM-DD HH:mm:ss');
				}

				res.render('artist-list', {
					'title': '用户列表',
					'menu' : 'userlist',
					'userlist' : result,
					'ucounts' : result.length
				});
				db.close();
			});
		});
		
	}else if(type === 'detail'){
		var openid = get_param(req).openid;

		MongoClient.connect(DB_CONN_STR, function(err, db) {
			selectDataOne(db, 'user', {openid: openid}, function(result) {
				res.send(result);
				db.close();
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

	}else if (param.type && param.type === 'addartist') {//存储用户授权的公开信息

		param.time = Date.now();//定义一个初始时间
		//这里定义多一个ATID作为查询主键入库
		param.atid = utils.randomString(6);

		MongoClient.connect(DB_CONN_STR, function(err, db) {
			selectDataOne(db, 'artist', {aneme: param.aneme}, function(result) {
				if (result.length === 0) {
					insertData(db, 'artist', param, function(_res) {
						//写入数据表成功
						res.json({"status":"200"});
						db.close();
					});
				}else{
					//数据库里面存在相同的openid，不用做任何处理
					res.json({"status":"201", "msg":"已有艺人"});
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
		param.counts = Number(0);//初始视频个数都是0

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
				//更新对应专辑下的视频个数
				db.collection('album').findAndModify(
					{ cid: param.cid }, [],
					{ $inc: { "counts": 1 } },
					{ upsert: true, new: true },
					function(err, doc) {
						// res.send(doc.value);
						res.send({status: 'ok', vid: result.ops[0].vid});
						db.close();
					}
				);
			});

		});
	}else if(param.vid && param.type === 'playvideo'){//用户播放视频，更新播放量、写入历史记录等操作

		// param.time = Date.now();
		
		MongoClient.connect(DB_CONN_STR, function(err, db) {
			db.collection('video').findAndModify(
				{ vid: param.vid }, [],
				{ $inc: { "playcount": 1 } },
				{ upsert: true, new: true },
				function(err, doc) {
					res.send({status: 'ok', msg: 'success'});
					db.close();
				}
			);
		});
	}else if(param.type && param.type === 'updateVideo'){//更新视频信息

		param.time = Date.now();//定义一个更新时间
		
		MongoClient.connect(DB_CONN_STR, function(err, db) {
			db.collection('video').update({vid: param.vid}, param);

			//写入数据表成功
			res.send({status: 'ok', type: 'updateVideo'});
			db.close();
		});
	}else if(param.ac === 'delete'){//删除专辑or视频
		
		MongoClient.connect(DB_CONN_STR, function(err, db) {
			if (param.type === 'video') {
				db.collection('video').findAndRemove({ vid: param.vid }, [],
					function(err, doc) {
						res.send(doc);
						db.close();
					}
				);
			}else if(param.type === 'album'){
				db.collection('album').findAndRemove(
					{ cid: param.cid }, [],
					function(err, doc) {
						db.collection('video').update(
							{cid: param.cid},
							{$set:
								{'cname': '请选择专辑', 'cid': '-1'}
							},
							{multi: true} //找到的视频列表全部都改了
						);

						res.send({status: 'ok', msg: 'delete album success'});
						db.close();
					}
				);
			}
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
			db.collection('history').update(
				{ openid: param.openid }, 
				{$set:{'data': hisArr, 'time': time} }, 
				{upsert: true}
			);
			//更新收藏列表
			db.collection('collect').update(
				{ openid: param.openid }, 
				{$set:{'data': collectArr, 'time': time} }, 
				{upsert: true}
			);

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

