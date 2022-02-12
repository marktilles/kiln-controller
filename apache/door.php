<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
<head>
<meta name="viewport" content="width=device-width" />
<title>Door Control</title>
<style>
body {
    font: 10pt Arial;
    margin: 10px;
}
table, th, td {
    font: 10pt Arial;
    border: 1px solid gray;
    text-align: center;
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
<center><h1>Door Control (GPIO 27)</h1>      
        
<a href = "gpiodashboard">GPIO Dashboard</a> | <a href = "../gpio.php">Mark's Kiln Card GPIO</a> | <a href = "http://192.168.0.13:8081">Kiln Controller</a>
<BR><BR>
<?php

	if (isset($_GET['door'])) {
      		$door = $_GET['door']; 
	} else{
     		$door = "";
	}

	$input1 = shell_exec("/usr/bin/gpio -g read 27");
	// THIS NEXT VALUE DOESNT REALLY SHOW CORECT AFTER THE LAST CHOICE IS POSTED.
	// echo "<center>Current Value = $input1</center>";

   	if ($door == "")
        	{
        	//shell_exec("/usr/bin/gpio -g write 27 0");
		if ($input1 == 0){
		   echo "<center>LOCKED 	&#128272;</center>";
			?>
			<form method="get" action="door.php">                
			<input type="submit" style = "font-size: 14 pt; background-color: green" value="Entry" name="door">
         		<input type="submit" style = "font-size: 14 pt; background-color: red" value="Unlock" name="door">
        		</form>
			<?php
		}
		else {
		   echo '<center><font color = "red"><b>UNLOCKED &#128275;</b></font></center>';
			?>
			<form method="get" action="door.php">                
           		<input type="submit" style = "font-size: 14 pt; background-color: green" value="Lock" name="door">
        		</form>
			<?php
		}
	}
   	if ($door == "Lock")
        	{
		exec("/usr/lib/cgi-bin/lockdoor.cgi > /dev/null &");
		echo "<center>Executing: $door &#128272;</center>";
		?>
			<br>Please wait ...
		<?php
		header("Refresh:1; url=door.php");
	}

    	else if ($door == "Unlock")
        	{
		exec("/usr/lib/cgi-bin/unlockdoor.cgi > /dev/null &");
		echo "<center><font color = 'red'>Executing: $door &#128275;</font></center>";
		?>
			<br>Please wait ...
		<?php
		header("Refresh:1; url=door.php");
        }
   	else if ($door == "Entry")
        	{
		exec("/usr/lib/cgi-bin/toggledoor.cgi > /dev/null 2>&1 &");
		echo "<center>Executing: $door &#128275;&#128272</center>";
		?>
			<br>Please wait ...
		<?php
		header("Refresh:11; url=door.php");
	}
	// Refrsh this page each 10 secods to update the screen status.

?>


<br><br><br>
Add: automatic locking of the door as a CRON job.<br>
Dont let it stay unlocked more than one hour. <br>
Also enable a MANUAL indoor unlock for safety purposes!</b>


   </body>
</html>

