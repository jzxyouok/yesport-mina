<?php
	header('Content-Type:text/json');
	$id = $_GET['type'];
	if ($id == 'index') {
		$contents = file_get_contents('data-index.js');
	}elseif ($id == 'detail') {
		$contents = file_get_contents('data-detail.js');
	}
	exit($contents);
?>