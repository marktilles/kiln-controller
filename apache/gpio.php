<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
<head>
<meta name="viewport" content="width=device-width" />
<title>View GPIO Status</title>
<style>
body {
    font: 10pt Arial;
    margin: 10px;
}
table, th, td {
    font: 10pt Arial;
    border: 1px solid gray;
    text-align: left;
    border-collapse: collapse;
    padding: 3px;
}
table {
    border: 2px solid gray;
}
.buttonLow {
    color: #c00000;
}
.buttonHigh {
    color: #008000;
}
</style>
</head>

<body>
<center><h1>View GPIO Status</h1>      

<a href = "../door.php">Door Control</a> | <a href = "gpiodashboard">GPIO Dashboard</a> | <a href = "http://192.168.0.13:8081">Kiln Controller</a>
<BR>
<BR>

<table><tr valign="top"><td><img src="MarksKilnCard.png" width="320" title="Marks Kiln Card" alt="Marks Kin Card" />
</td><td><br><br><br><br>GPIOs up to #8 normally HIGH; #9 and up normally LOW.
<br><br>

<center><input type='submit' name='submitRefresh' value='Refresh Window' onclick='window.location.reload();'></center><br>

<?php


	$resultA = shell_exec ("gpio -1 read 36");
	echo "PORT-A (AUX) GPIO 16 Service running (kiln-controller.py) = $resultA";

	$resultB = shell_exec ("gpio -1 read 15");
	echo "<br>PORT-B (AUX) GPIO 22 Drejstuga door = $resultB";

	$resultC = shell_exec ("gpio -1 read 11");
	echo "<br>PORT-C (AUX) GPIO 17 Heat relay (config.py) = $resultC";

	$resultD = shell_exec ("gpio -1 read 13");
	echo "<br>PORT-D (AUX) GPIO 27 = $resultD";

	$resultG = shell_exec ("gpio -1 read 7");
	echo "<br>PORT-G (AUX) GPIO 4 = $resultG";

	$resultH = shell_exec ("gpio -1 read 31");
	echo "<br>PORT-H (AUX)  GPIO 6 = $resultH";

	echo '</td></tr></table>';
?>
   </body>
</html>

