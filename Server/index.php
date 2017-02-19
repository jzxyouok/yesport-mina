<?php
	header('Content-Type:text/json');
	$id = $_GET['type'];
	if ($id == 'index') {
		$contents = file_get_contents('data-index.js');
	}elseif ($id == 'detail') {
		$contents = file_get_contents('data-detail.js');
	}elseif ($id == 'addemail') {
		$email = $_GET['data'];
		if (file_get_contents('emailist.db')) {
			$arr = array(file_get_contents('emailist.db'));
		}else{
			$arr = array();
		}
		array_push($arr, $email)
		file_put_contents('emailist.db', $arr);
		exit('done!');
	}
	exit($contents);
?>