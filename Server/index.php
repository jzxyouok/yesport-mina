<?php
	header('Content-Type:text/json');
	//定义服务器时间
	date_default_timezone_set("PRC");
	$time = date("H:i:s");

	$mem = new Memcached();
	$mem->addServer("127.0.0.1", 11211) or die ("Could not connect");

	$id = $_GET['type'];
	if ($id == 'index') {
		$contents = file_get_contents('data-index.js');

		exit($contents);
	}elseif ($id == 'detail') {
		$contents = file_get_contents('data-detail.js');

		exit($contents);
	}

	$emailtype = $_GET['type'];
	if ($emailtype == 'setemail') {
		$email = $_GET['email'];

		if ($mem->get('emailist')) {
			$arr = $mem->get('emailist');
		}else{
			$arr = array();
		}

		$option = array(
			'status' => '200',
			'email' => $email
		);
		array_unshift($arr, $option);

		// 往 memcached 中写入对象
		$mem->set('emailist', $arr);

		exit(json_encode($option));

	}elseif ($emailtype == 'getemail') {
		$val = $mem->get('emailist');
		exit(json_encode($val));
	}
?>