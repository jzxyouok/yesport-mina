var url = require('url');
var qs = require('querystring');
var fs = require('fs')
var express = require('express');
var app = express();
var formidable = require('formidable');
var path = require('path');

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var get_param = function(req) {
	return qs.parse(url.parse(req.url).query);
};

//数据库配置
var MongoClient = require('mongodb').MongoClient;
var DB_CONN_STR = 'mongodb://localhost:27017/yechtv';

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
  //查询全部
  collection.find().toArray(function(err, result) {
	if(err)
	{
	  console.log('Error:'+ err);
	  return;
	}
	callback(result);
  });
};

app.set('port',process.env.PORT || 8001);//设置端口

//使用static中间件 public目录为静态资源目录
app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {

	var type = get_param(req).type;
	if (type && type === 'getalbum') {
		MongoClient.connect(DB_CONN_STR, function(err, db) {
			selectData(db, 'album', function(result) {
				res.send(result);
				db.close();
			});
		});
	}else{
		res.type('html').send( fs.readFileSync(__dirname + '/views/index.html') );
	}

});

/*
	邮箱列表，mongod存储数据
*/
app.post('/', function(req, res){
	var param = req.body

	if (param.email && param.type === 'setemail') {//存储emailist

		MongoClient.connect(DB_CONN_STR, function(err, db) {
			insertData(db, 'album', param, function(result) {
				//写入数据表成功
				res.send('{"status":"200"}');
				db.close();
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
	}
});

app.post('/upload', function(req, res, next){
	var form = new formidable.IncomingForm();
    form.uploadDir = path.join(__dirname, 'tmp');   //文件保存的临时目录为当前项目下的tmp文件夹
    form.maxFieldsSize = 1 * 1024 * 1024;  //用户头像大小限制为最大1M  
    form.keepExtensions = true;        //使用文件的原扩展名
    form.parse(req, function (err, fields, file) {
        var filePath = '';
        //如果提交文件的form中将上传文件的input名设置为tmpFile，就从tmpFile中取上传文件。否则取for in循环第一个上传的文件。
        if(file.tmpFile){
            filePath = file.tmpFile.path;
        } else {
            for(var key in file){
                if( file[key].path && filePath==='' ){
                    filePath = file[key].path;
                    break;
                }
            }
        }
        //文件移动的目录文件夹，不存在时创建目标文件夹
        var targetDir = path.join(__dirname, 'upload');
        if (!fs.existsSync(targetDir)) {
            fs.mkdir(targetDir);
        }
        var fileExt = filePath.substring(filePath.lastIndexOf('.'));
        //判断文件类型是否允许上传
        if (('.jpg.jpeg.png.gif').indexOf(fileExt.toLowerCase()) === -1) {
            var err = new Error('此文件类型不允许上传');
            res.json({code:-1, message:'此文件类型不允许上传'});
        } else {
            //以当前时间戳对上传文件进行重命名
            var fileName = new Date().getTime() + fileExt;
            var targetFile = path.join(targetDir, fileName);
            //移动文件
            fs.rename(filePath, targetFile, function (err) {
                if (err) {
                    console.info(err);
                    res.json({code:-1, message:'操作失败'});
                } else {
                    //上传成功，返回文件的相对路径
                    var fileUrl = '/upload/' + fileName;
                    res.json({code:0, fileUrl:fileUrl});
                }
            });
        }
    });
})

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

