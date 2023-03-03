var state = "IDLE";
var state_last = "";
var graph = [ 'profile', 'live'];
var points = [];
var profiles = [];
var time_mode = 0;
var selected_profile = 0;
var selected_profile_name = 'cone-05-long-bisque.json';
var temp_scale = "c";
var time_scale_slope = "h";
var time_scale_profile = "h";
var time_scale_long = "Seconds";
var temp_scale_display = "C";
var kwh_rate = 0.26;
var currency_type = "EUR";
var function_passcode = "ABCDE";
var kw_elements = 99999;

var protocol = 'ws:';
if (window.location.protocol == 'https:') {
    protocol = 'wss:';
}
var host = "" + protocol + "//" + window.location.hostname + ":" + window.location.port;
var ws_status = new WebSocket(host+"/status");
var ws_control = new WebSocket(host+"/control");
var ws_config = new WebSocket(host+"/config");
var ws_storage = new WebSocket(host+"/storage");

var emergency_shutoff_temp;

// Added simple passcode check routine
function checkPasscode () {
        // Check hard-coded passcode
        let inputtxt = prompt("CAUTION! Enter passcode to process command:", "");
        if ( ( (inputtxt.toUpperCase()).trim()) == ( ( function_passcode.toUpperCase() ).trim() ) ) {
             console.log("Correct passcode entered " + function_passcode + " (" + inputtxt + ")")
             return true;
         }
        else {
             console.log("Incorrect passcode entered: " + inputtxt + " (" + function_passcode + ")")
             return false;
        }
}

// ADDED OPTON TO HAVE BACKEND FUNCTION
function BACKEND_FUNCTION_1() {
        if (checkPasscode() == true) {
            var cmd =
   	    {
   	       "cmd": "BACKEND_FUNCTION_1",
  	    }
            $.bootstrapGrowl("<span class=\"glyphicon glyphicon-exclamation-sign\"></span> <b>Performing immediate shutdown and power-off!<br><br>To reboot, remove power supply for 15 seconds. NOTE! Any curently running firing will restart if within the automatic_restart_window time setting!</b>", {
                        ele: 'body', // which element to append to
                        type: 'error', // (null, 'info', 'error', 'success')
                        offset: {from: 'top', amount: 250}, // 'top', or 'bottom'
                        align: 'center', // ('left', 'right', or 'center')
                        width: 385, // (integer, or 'auto')
                        delay: 0,
                        allow_dismiss: false,
                        stackup_spacing: 10 // spacing between consecutively stacked growls.
            });
  	    ws_control.send(JSON.stringify(cmd));
           }
        else
           {
              alert('Wrong pascode!')
              return false;
           }
}
// END ADDED OPTON TO HAVE BACKEND FUNCTION

// ADDED TO BE ABLE TO SWAP BETWEEN TWO DIFFERENT KILN INSTANCES
function BACKEND_FUNCTION_2() {
           if (checkPasscode() == true) {
	      var cmd =
              {
   	         "cmd": "BACKEND_FUNCTION_2",
  	      }
   	      $.bootstrapGrowl("<span class=\"glyphicon glyphicon-time\"></span> <b>Restarting services, please wait 10 seconds before refreshing browser.</b>", {
                ele: 'body', // which element to append to
                type: 'info', // (null, 'info', 'error', 'success')
                offset: {from: 'top', amount: 250}, // 'top', or 'bottom'
                align: 'center', // ('left', 'right', or 'center')
                width: 550, // (integer, or 'auto')
                delay: 10000,
                allow_dismiss: true,
                stackup_spacing: 10 // spacing between consecutively stacked growls.
              });

              $.bootstrapGrowl("<span class=\"glyphicon glyphicon-list\"></span> <b>Now, once the blue box above disappears, verify<br>(1) The switches on the controller box are set to correct oven;<br>(2) Correct oven power cable is connected to the power brick;<br>(3) Press the \"<span class=\"glyphicon glyphicon-repeat\"></span>\" refresh symbol on the web browser (above).</b>", {
                ele: 'body', // which element to append to
                type: 'error', // (null, 'info', 'error', 'success')
                offset: {from: 'top', amount: 250}, // 'top', or 'bottom'
                align: 'center', // ('left', 'right', or 'center')
                width: 550, // (integer, or 'auto')
                delay: 0,
                allow_dismiss: false,
                stackup_spacing: 10 // spacing between consecutively stacked growls.

              });
  	      ws_control.send(JSON.stringify(cmd));
           }
           else
           {
              alert('Wrong pascode!')
              return false;
           }
}
// ADDED TO BE ABLE TO SWAP BETWEEN TWO DIFFERENT KILN INSTANCES§:w

if(window.webkitRequestAnimationFrame) window.requestAnimationFrame = window.webkitRequestAnimationFrame;

graph.profile =
{
    label: "Profile",
    data: [],
    points: { show: false },
    color: "#75890c",
    draggable: false
};

graph.live =
{
    label: "Live",
    data: [],
    points: { show: false },
    color: "#d8d3c5",
    draggable: false
};


function updateProfile(id)
{
    selected_profile = id;
    selected_profile_name = profiles[id].name;
    var job_seconds = profiles[id].data.length === 0 ? 0 : parseInt(profiles[id].data[profiles[id].data.length-1][0]);
    var kwh = (kw_elements*job_seconds/3600).toFixed(2);
    var cost =  (kwh*kwh_rate).toFixed(2);
    var job_time = new Date(job_seconds * 1000).toISOString().substr(11, 8);
    $('#sel_prof').html(profiles[id].name);
    $('#sel_prof_eta').html(job_time);
    //$('#sel_prof_cost').html(kwh + ' kWh ('+ currency_type +': '+ cost +')');
    graph.profile.data = profiles[id].data;
    graph.plot = $.plot("#graph_container", [ graph.profile, graph.live ] , getOptions());
}

function deleteProfile()
{
    var profile = { "type": "profile", "data": "", "name": selected_profile_name };
    var delete_struct = { "cmd": "DELETE", "profile": profile };

    var delete_cmd = JSON.stringify(delete_struct);
    console.log("Delete profile:" + selected_profile_name);

    ws_storage.send(delete_cmd);

    ws_storage.send('GET');
    selected_profile_name = profiles[0].name;

    state="IDLE";
    $('#edit').hide();
    $('#profile_selector').show();
    $('#btn_controls').show();
    $('#status').slideDown();
    $('#profile_table').slideUp();
    $('#e2').select2('val', 0);
    graph.profile.points.show = false;
    graph.profile.draggable = false;
    graph.plot = $.plot("#graph_container", [ graph.profile, graph.live ], getOptions());
}


function updateProgress(percentage)
{
    if(state=="RUNNING")
    {
        if(percentage > 100) percentage = 100;
        $('#progressBar').css('width', percentage+'%');
        if(percentage>5) $('#progressBar').html(parseInt(percentage)+'%');
    }
    else
    {
        $('#progressBar').css('width', 0+'%');
        $('#progressBar').html('');
    }
}

function updateProfileTable()
{
    var dps = 0;
    var slope = "";
    var color = "";

    var html = '<h3>Schedule Points</h3><div class="table-responsive" style="scroll: none"><table class="table table-striped">';
        html += '<tr><th style="width: 50px">#</th><th>Target Time in ' + time_scale_long+ '</th><th>Target Temperature in °'+temp_scale_display+'</th><th>Slope in &deg;'+temp_scale_display+'/'+time_scale_slope+'</th><th></th></tr>';

    for(var i=0; i<graph.profile.data.length;i++)
    {

        if (i>=1) dps =  ((graph.profile.data[i][1]-graph.profile.data[i-1][1])/(graph.profile.data[i][0]-graph.profile.data[i-1][0]) * 10) / 10;
        if (dps  > 0) { slope = "up";     color="rgba(206, 5, 5, 1)"; } else
        if (dps  < 0) { slope = "down";   color="rgba(23, 108, 204, 1)"; dps *= -1; } else
        if (dps == 0) { slope = "right";  color="grey"; }

        html += '<tr><td><h4>' + (i+1) + '</h4></td>';
        html += '<td><input type="text" class="form-control" id="profiletable-0-'+i+'" value="'+ timeProfileFormatter(graph.profile.data[i][0],true) + '" style="width: 60px" /></td>';
        html += '<td><input type="text" class="form-control" id="profiletable-1-'+i+'" value="'+ graph.profile.data[i][1] + '" style="width: 60px" /></td>';
        html += '<td><div class="input-group"><span class="glyphicon glyphicon-circle-arrow-' + slope + ' input-group-addon ds-trend" style="background: '+color+'"></span><input type="text" class="form-control ds-input" readonly value="' + formatDPS(dps) + '" style="width: 100px" /></div></td>';
        html += '<td>&nbsp;</td></tr>';
    }

    html += '</table></div>';

    $('#profile_table').html(html);

    //Link table to graph
    $(".form-control").change(function(e)
        {
            var id = $(this)[0].id; //e.currentTarget.attributes.id
            var value = parseInt($(this)[0].value);
            var fields = id.split("-");
            var col = parseInt(fields[1]);
            var row = parseInt(fields[2]);

            if (graph.profile.data.length > 0) {
            if (col == 0) {
                graph.profile.data[row][col] = timeProfileFormatter(value,false);
            }
            else {
                graph.profile.data[row][col] = value;
            }

            graph.plot = $.plot("#graph_container", [ graph.profile, graph.live ], getOptions());
            }
            updateProfileTable();

        });
}

function timeProfileFormatter(val, down) {
    var rval = val
    switch(time_scale_profile){
        case "m":
            if (down) {rval = val / 60;} else {rval = val * 60;}
            break;
        case "h":
            if (down) {rval = val / 3600;} else {rval = val * 3600;}
            break;
    }
    return Math.round(rval);
}

function formatDPS(val) {
    var tval = val;
    if (time_scale_slope == "m") {
        tval = val * 60;
    }
    if (time_scale_slope == "h") {
        tval = (val * 60) * 60;
    }
    return Math.round(tval);
}

function hazardTemp(){

    if (temp_scale == "f") {
        return (1500 * 9 / 5) + 32
    }
    else {
        return 1500
    }
}

function timeTickFormatter(val,axis)
{
// hours
if(axis.max>3600) {
  //var hours = Math.floor(val / (3600));
  //return hours;
  return Math.floor(val/3600);
  }

// minutes
if(axis.max<=3600) {
  return Math.floor(val/60);
  }

// seconds
if(axis.max<=60) {
  return val;
  }
}
function runTask()
{
    var cmd =
    {
        "cmd": "RUN",
        "profile": profiles[selected_profile]
    }

    graph.live.data = [];
    graph.plot = $.plot("#graph_container", [ graph.profile, graph.live ] , getOptions());

    ws_control.send(JSON.stringify(cmd));

}

function scheduleTask()
{
  // Start and stop the selected curve so the screen will show correct scheduled curve at refreshing
  var cmd =
  {
      "cmd": "RUN",
      "profile": profiles[selected_profile]
   }
   ws_control.send(JSON.stringify(cmd));
   // Start and stop the selected curve so the screen will show correct scheduled curve at refreshing
   var cmd = {"cmd": "STOP"};
   ws_control.send(JSON.stringify(cmd));

  // Now proceed with scheduling the firing curve
    const startTime = document.getElementById('scheduled-run-time').value;
    console.log(startTime);

    var cmd =
    {
        "cmd": "SCHEDULED_RUN",
        "profile": profiles[selected_profile],
        "scheduledStartTime": startTime,
    }

    graph.live.data = [];
    graph.plot = $.plot("#graph_container", [ graph.profile, graph.live ] , getOptions());

    ws_control.send(JSON.stringify(cmd));
}

function runTaskSimulation()
{
    var cmd =
    {
        "cmd": "SIMULATE",
        "profile": profiles[selected_profile]
    }

    graph.live.data = [];
    graph.plot = $.plot("#graph_container", [ graph.profile, graph.live ] , getOptions());

    ws_control.send(JSON.stringify(cmd));

}


function abortTask()
{
    if (checkPasscode() == true) {
       var cmd = {"cmd": "STOP"};
       ws_control.send(JSON.stringify(cmd));
    }
    else
    {
       alert('Wrong pascode!')
       return false;
    }
}

function enterNewMode()
{
    state="EDIT"
    $('#status').slideUp();
    $('#edit').show();
    $('#profile_selector').hide();
    $('#btn_controls').hide();
    $('#form_profile_name').attr('value', '');
    $('#form_profile_name').attr('placeholder', 'Please enter a name');
    graph.profile.points.show = true;
    graph.profile.draggable = true;
    graph.profile.data = [];
    graph.plot = $.plot("#graph_container", [ graph.profile, graph.live ], getOptions());
    updateProfileTable();
}

function enterEditMode()
{
    $("#nav_cancel").hide();
    state="EDIT"
    $('#status').slideUp();
    $('#edit').show();
    $('#profile_selector').hide();
    $('#btn_controls').hide();
    console.log(profiles);
    $('#form_profile_name').val(profiles[selected_profile].name);
    graph.profile.points.show = true;
    graph.profile.draggable = true;
    graph.plot = $.plot("#graph_container", [ graph.profile, graph.live ], getOptions());
    updateProfileTable();
}

function leaveEditMode()
{
    $("#nav_cancel").hide();
    selected_profile_name = $('#form_profile_name').val();
    ws_storage.send('GET');
    state="IDLE";
    $('#edit').hide();
    $('#profile_selector').show();
    $('#btn_controls').show();
    $('#status').slideDown();
    $('#profile_table').slideUp();
    graph.profile.points.show = false;
    graph.profile.draggable = false;
    graph.plot = $.plot("#graph_container", [ graph.profile, graph.live ], getOptions());
}

function newPoint()
{
    if(graph.profile.data.length > 0)
    {
        var pointx = parseInt(graph.profile.data[graph.profile.data.length-1][0])+15;
    }
    else
    {
        var pointx = 0;
    }
    graph.profile.data.push([pointx, Math.floor((Math.random()*230)+25)]);
    graph.plot = $.plot("#graph_container", [ graph.profile, graph.live ], getOptions());
    updateProfileTable();
}

function delPoint()
{
    graph.profile.data.splice(-1,1)
    graph.plot = $.plot("#graph_container", [ graph.profile, graph.live ], getOptions());
    updateProfileTable();
}

function toggleTable()
{
    if($('#profile_table').css('display') == 'none')
    {
        $('#profile_table').slideDown();
    }
    else
    {
        $('#profile_table').slideUp();
    }
}

function saveProfile()
{
    name = $('#form_profile_name').val();
    var rawdata = graph.plot.getData()[0].data
    var data = [];
    var last = -1;

    for(var i=0; i<rawdata.length;i++)
    {
        if(rawdata[i][0] > last)
        {
          data.push([rawdata[i][0], rawdata[i][1]]);
        }
        else
        {
          $.bootstrapGrowl("<span class=\"glyphicon glyphicon-exclamation-sign\"></span> <b>ERROR 88:</b><br/>An oven is not a time-machine", {
            ele: 'body', // which element to append to
            type: 'alert', // (null, 'info', 'error', 'success')
            offset: {from: 'top', amount: 250}, // 'top', or 'bottom'
            align: 'center', // ('left', 'right', or 'center')
            width: 385, // (integer, or 'auto')
            delay: 5000,
            allow_dismiss: true,
            stackup_spacing: 10 // spacing between consecutively stacked growls.
          });

          return false;
        }

        last = rawdata[i][0];
    }

    var profile = { "type": "profile", "data": data, "name": name }
    var put = { "cmd": "PUT", "profile": profile }

    var put_cmd = JSON.stringify(put);

    ws_storage.send(put_cmd);

    leaveEditMode();
}

function get_tick_size() {
switch(time_scale_profile){
  case "s":
    return 1;
  case "m":
    return 60;
  case "h":
    return 3600;
  }
return 3600;
}

function get_tick_size_mt() {
switch(time_scale_profile){
  case "s":
    return 3600;
  case "m":
    return 3600;
  case "h":
    return 3600;
  }
return 3600;
}

function getOptions()
{

  var options =
  {

    series:
    {
        lines:
        {
            show: true
        },

        points:
        {
            show: true,
            radius: 5,
            symbol: "circle"
        },

        shadowSize: 3

    },

	xaxis:
    {
      min: 0,
      tickColor: 'rgba(216, 211, 197, 0.2)',
      tickFormatter: timeTickFormatter,
      tickSize: get_tick_size_mt(),
      font:
      {
        size: 14,
        lineHeight: 14,        weight: "normal",
        family: "Digi",
        variant: "small-caps",
        color: "rgba(216, 211, 197, 0.85)"
      }
	},

	yaxis:
    {
      min: 0,
      tickDecimals: 0,
      draggable: false,
      tickColor: 'rgba(216, 211, 197, 0.2)',
      font:
      {
        size: 14,
        lineHeight: 14,
        weight: "normal",
        family: "Digi",
        variant: "small-caps",
        color: "rgba(216, 211, 197, 0.85)"
      }
	},

	grid:
    {
	  color: 'rgba(216, 211, 197, 0.55)',
      borderWidth: 1,
      labelMargin: 10,
      mouseActiveRadius: 50
	},

    legend:
    {
      show: false
    }
  }

  return options;

}

function formatDateInput(date)
{
    var dd = date.getDate();
    var mm = date.getMonth() + 1; //January is 0!
    var yyyy = date.getFullYear();
    var hh = date.getHours();
    var mins = date.getMinutes();

    if (dd < 10) {
        dd = '0' + dd;
    }

    if (mm < 10) {
        mm = '0' + mm;
    }

    const formattedDate = yyyy + '-' + mm + '-' + dd + 'T' + hh + ':' + mins;
    return formattedDate;
}

function initDatetimePicker() {
    const now = new Date();
    const inThirtyMinutes = new Date();
    inThirtyMinutes.setMinutes(inThirtyMinutes.getMinutes() + 10);
    $('#scheduled-run-time').attr('value', formatDateInput(inThirtyMinutes));
    $('#scheduled-run-time').attr('min', formatDateInput(now));
}

$(document).ready(function()
{
    initDatetimePicker();

    if(!("WebSocket" in window))
    {
        $('#chatLog, input, button, #examples').fadeOut("fast");
        $('<p>Oh no, you need a browser that supports WebSockets. How about <a href="http://www.google.com/chrome">Google Chrome</a>?</p>').appendTo('#container');
    }
    else
    {

        // Status Socket ////////////////////////////////

        ws_status.onopen = function()
        {
            console.log("Status Socket has been opened");
        };

        ws_status.onclose = function()
        {
            $.bootstrapGrowl("<span class=\"glyphicon glyphicon-exclamation-sign\"></span> <b>ERROR:</b><br/>Services being restarted please wait; Status Websocket not available", {
            ele: 'body', // which element to append to
            type: 'error', // (null, 'info', 'error', 'success')
            offset: {from: 'top', amount: 250}, // 'top', or 'bottom'
            align: 'center', // ('left', 'right', or 'center')
            width: 550, // (integer, or 'auto')
            delay: 5000,
            allow_dismiss: true,
            stackup_spacing: 10 // spacing between consecutively stacked growls.
          });
        };

        ws_status.onmessage = function(e)
        {
            console.log("received status data")
            console.log(e.data);

            x = JSON.parse(e.data);
            if (x.type == "backlog")
            {
                if (x.profile)
                {
                    selected_profile_name = x.profile.name;
                    $.each(profiles,  function(i,v) {
                        if(v.name == x.profile.name) {
                            updateProfile(i);
                            $('#e2').select2('val', i);
                        }
                    });
                }

                $.each(x.log, function(i,v) {
                    graph.live.data.push([v.runtime, v.temperature]);
                    graph.plot = $.plot("#graph_container", [ graph.profile, graph.live ] , getOptions());
                });
            }

            if(state!="EDIT")
            {
                state = x.state;

                if (state!=state_last)
                {
                    if(state_last == "RUNNING")
                    {
                        $('#target_temp').html('---');
                        updateProgress(0);
                        canceltime = new Date().toLocaleTimeString();//.substr(11, 8);
                        $.bootstrapGrowl("<span class=\"glyphicon glyphicon-exclamation-sign\"></span> <b>Run completed or aborted " + canceltime + "</b>", {
                        ele: 'body', // which element to append to
                        type: 'success', // (null, 'info', 'error', 'success')
                        offset: {from: 'top', amount: 250}, // 'top', or 'bottom'
                        align: 'center', // ('left', 'right', or 'center')
                        width: 385, // (integer, or 'auto')
                        delay: 0,
                        allow_dismiss: true,
                        stackup_spacing: 10 // spacing between consecutively stacked growls.
                        });
                        $("#nav_action").hide();
                    }
                    else if (state_last == "SCHEDULED")
                    {
                        $("#nav_cancel").hide();
                        $('#target_temp').html('---');
                        updateProgress(0);
                        //canceltime = new Date().toLocaleTimeString();//.substr(11, 8);
                        //$.bootstrapGrowl("<span class=\"glyphicon glyphicon-exclamation-sign\"></span> <b>Schedule transitioned or canceled " + canceltime + "</b>", {
                        //ele: 'body', // which element to append to
                        //type: 'info', // (null, 'info', 'error', 'success')
                        //offset: {from: 'top', amount: 250}, // 'top', or 'bottom'
                        //align: 'center', // ('left', 'right', or 'center')
                        //width: 385, // (integer, or 'auto')
                        //delay: 3000,
                        //allow_dismiss: true,
                        //stackup_spacing: 10 // spacing between consecutively stacked growls.
                        //});
                    }
                    else
                    {
                        $("#nav_cancel").hide();
                    }
                }

                if(state=="RUNNING")
                {
                    $("#show_BACKEND_FUNCTION_2").hide();
                    // DONT ALLOW CHANGES UNDER ACTIVE FIRING
                    $("#btn_delProfile").hide();
                    $("#btn_newPoint").hide();
                    $("#btn_delPoint").hide();
                    $("#btn_new").hide();
                    $("#allow_save_button").hide();
                    $("#changes_locked").show();
                    // END DONT ALLOW CHANGES UNDER ACTIVE FIRING
                    $("#nav_cancel").hide();
                    $('#schedule-status').hide()
                    $("#nav_start").hide();
                    $("#nav_stop").show();
                    $("#timer").removeClass("ds-led-timer-active");
                    heat_now = (x.heat*50).toFixed(0); // This displays time percentage Heat is ON in heating cycle

                    graph.live.data.push([x.runtime, x.temperature]);
                    graph.plot = $.plot("#graph_container", [ graph.profile, graph.live ] , getOptions());

                    left = parseInt(x.totaltime-x.runtime);
                    eta = new Date(left * 1000).toISOString().substr(11, 8);

                    updateProgress(parseFloat(x.runtime)/parseFloat(x.totaltime)*100);
                    $('#state').html('<span class="glyphicon glyphicon-time" style="font-size: 22px; font-weight: normal"></span><span style="font-family: Digi; font-size: 28px;">' + eta + ' </span><span class=ds-text-small>&#9832;&#xfe0e; ' + heat_now + '%</span>');
                    $('#target_temp').html(parseInt(x.target));
                    //$('#cost').html(x.currency_type + parseFloat(x.cost).toFixed(2));
                    $('#cost').html(parseFloat(x.cost).toFixed(2));
                    $('#kwh').html((x.cost / kwh_rate).toFixed(2));

                    // WANT TO CHANGE BEHAVIOR OF THE LAMPS ON WEB PAGE
                    // Turn on/off relabeled web page icons, now labeled running and idle
                    $('#running').addClass("ds-led-heat-active");   // RUNNING
                    if (x.temperature > x.target)
                       {
                        $('#running').removeClass("ds-led-heat-active"); // RUNNING
                        $('#running').addClass("ds-led-cool-active"); // RUNNING

                       }
                    $('#idle').removeClass("ds-led-hazard-active"); // IDLE

                    // Add compare statements, I want to show different heating icon color depending on amount of heating
                    if (heat_now > 99) {
                    $('#state').html('<span class="glyphicon glyphicon-time" style="font-size: 22px; font-weight: normal"></span><span style="font-family: Digi; font-size: 28px;">' + eta + ' </span><span class=ds-text-small-red>&#9832;&#xfe0e; ' + heat_now + '%</span>');
                    // I want blinking red like original when full blast on
                      setTimeout(function() { $('#heat').addClass("ds-led-heat-active") }, 0 )
                      setTimeout(function() { $('#heat').removeClass("ds-led-heat-active") }, (x.heat*1000.0)-5)
                    }
                    // I want blinking yellow when heater is on but not full blast
                    else if (heat_now > 0.0) {
                      $('#state').html('<span class="glyphicon glyphicon-time" style="font-size: 22px; font-weight: normal"></span><span style="font-family: Digi; font-size: 28px;">' + eta + ' </span><span class=ds-text-small-yellow>&#9832;&#xfe0e; ' + heat_now + '%</span>');
                      setTimeout(function() { $('#heat').addClass("ds-led-hazard-active") }, 0 )
                      setTimeout(function() { $('#heat').removeClass("ds-led-hazard-active") }, (x.heat*1000.0)-5)
                    }

                }
                else if (state === "SCHEDULED") {
                    $("#show_BACKEND_FUNCTION_2").hide();
                    // DONT ALLOW CHANGES UNDER ACTIVE FIRING
                    $("#btn_delProfile").hide();
                    $("#btn_newPoint").hide();
                    $("#btn_delPoint").hide();
                    $("#btn_new").hide();
                    $("#allow_save_button").hide();
                    $("#changes_locked").show();
                    // END DONT ALLOW CHANGES UNDER ACTIVE FIRING
                    $("#nav_start").hide();
                    $("#nav_stop").hide();
                    $("#nav_cancel").show();
                    $('#timer').addClass("ds-led-timer-active"); // Start blinking timer symbol
                    $('#state').html('<p class="ds-text">'+state+'<span class=ds-text-small-light-blue>for '+x.scheduled_start+'</span></p>');
                }
                else
                {
                    // DONT ALLOW CHANGES UNDER ACTIVE FIRING
                    $("#btn_delProfile").show();
                    $("#allow_save_button").show();
                    $("#btn_newPoint").show();
                    $("#btn_delPoint").show();
                    $("#btn_new").show();
                    // END DONT ALLOW CHANGES UNDER ACTIVE FIRING
                    $("#show_BACKEND_FUNCTION_2").show();
                    $("#changes_locked").hide();
                    $("#profile_selector").show();
                    $("#nav_start").show();
                    $("#nav_stop").hide();
                    $("#nav_cancel").hide();
                    $("#timer").removeClass("ds-led-timer-active");
                    $('#state').html('<p class="ds-text">'+state+'</p>');
                    $('#schedule-status').hide()

                    $('#idle').addClass("ds-led-hazard-active");     // IDLE
                    $('#running').removeClass("ds-led-heat-active"); // RUNNING
                    $('#running').removeClass("ds-led-cool-active"); // RUNNING
		}

                $('#act_temp').html(parseInt(x.temperature));
                //$('#progressBar').html('<div class="bar" style="height:'+x.pidstats.out*70+'%;"></div>')

                if (x.temperature > warnat)
                {
                    // WE ARE APPROACHING WITHIN 5 DEGREES OF EMERGENCY TEMPERATURE
                    $('#hazard').addClass("ds-led-heat-active");
                    //ADD SEND EMAIL, TRIGGER GPIO SIREN WARNING SYSTEM, OR OTHER FUNCTIONS HERE IN CASE OF REAL EMERGENCY
                }
                else
                {
                    $('#hazard').removeClass("ds-led-hazard-active");
                }

                state_last = state;

            }
        };

        // Config Socket /////////////////////////////////

        ws_config.onopen = function()
        {
            ws_config.send('GET');
        };

        ws_config.onmessage = function(e)
        {
            console.log (e.data);
            x = JSON.parse(e.data);
            temp_scale = x.temp_scale;
            time_scale_slope = x.time_scale_slope;
            time_scale_profile = x.time_scale_profile;
            kwh_rate = x.kwh_rate;
            kw_elements = x.kw_elements;
            currency_type = x.currency_type;

            // ADDED TO BE ABLE TO PORT IN MORE INFORMATION TO GUI
            pid_kp = x.pid_kp;
            pid_ki = x.pid_ki;
            pid_kd = x.pid_kd;
            function_passcode = x.function_passcode;
            kiln_name = x.kiln_name;
            emergency_shutoff_temp = x.emergency_shutoff_temp; // make variable emergency_shutoff_tempavailable here
            warnat = emergency_shutoff_temp -5; // make variable emergency_shutoff_tempavailable here
            kiln_must_catch_up = x.kiln_must_catch_up;
            pid_control_window = x.pid_control_window;
            ignore_pid_control_window_until = x.ignore_pid_control_window_until;

            //$("#show_BACKEND_FUNCTION_1").hide(); // Hide this optional function by default
            $('#currency_type').html(x.currency_type);
            // MARK TILLES
            $('#kw_elements').html(kw_elements);
            //$('#capacity').html(10*1000);
            //////
            $("#kiln_name").html(kiln_name); // Define variable for web instance
            $("#pid_kp").html(pid_kp); // Define variable for web instance
            $("#pid_ki").html(pid_ki); // Define variable for web instance
            $("#pid_kd").html(pid_kd); // Define variable for web instance
            $("#emerg_temp").html(emergency_shutoff_temp); // Define variable for web instance
            $("#warnat").html(warnat); // Define variable for web instance
            if (kiln_must_catch_up == true)
            {
                $("#catch_up_max").html(pid_control_window + "\/" + ignore_pid_control_window_until); // Define variable for web instance
            }
            else
            {
                $("#catch_up_max").html("off"); // Define variable for web instance
            }
            // ADDED TO BE ABLE TO PORT IN MORE INFORMATION TO GUI
            if (temp_scale == "c") {temp_scale_display = "C";} else {temp_scale_display = "F";}


            $('#act_temp_scale').html('º'+temp_scale_display);
            $('#target_temp_scale').html('º'+temp_scale_display);

            switch(time_scale_profile){
                case "s":
                    time_scale_long = "Seconds";
                    break;
                case "m":
                    time_scale_long = "Minutes";
                    break;
                case "h":
                    time_scale_long = "Hours";
                    break;
            }

        }

        // Control Socket ////////////////////////////////

        ws_control.onopen = function()
        {

        };

        ws_control.onmessage = function(e)
        {
            //Data from Simulation
            console.log ("control socket has been opened")
            console.log (e.data);
            x = JSON.parse(e.data);
            graph.live.data.push([x.runtime, x.temperature]);
            graph.plot = $.plot("#graph_container", [ graph.profile, graph.live ] , getOptions());

        }

        // Storage Socket ///////////////////////////////

        ws_storage.onopen = function()
        {
            ws_storage.send('GET');
        };


        ws_storage.onmessage = function(e)
        {
            message = JSON.parse(e.data);

            if(message.resp)
            {
                if(message.resp == "FAIL")
                {
                    if (confirm('Overwrite?'))
                    {
                        message.force=true;
                        console.log("Sending: " + JSON.stringify(message));
                        ws_storage.send(JSON.stringify(message));
                    }
                    else
                    {
                        //do nothing
                    }
                }

                return;
            }

            //the message is an array of profiles
            //FIXME: this should be better, maybe a {"profiles": ...} container?
            profiles = message;
            //delete old options in select
            $('#e2').find('option').remove().end();
            // check if current selected value is a valid profile name
            // if not, update with first available profile name
            var valid_profile_names = profiles.map(function(a) {return a.name;});
            if (
              valid_profile_names.length > 0 &&
              $.inArray(selected_profile_name, valid_profile_names) === -1
            ) {
              selected_profile = 0;
              selected_profile_name = valid_profile_names[0];
            }

            // fill select with new options from websocket
            for (var i=0; i<profiles.length; i++)
            {
                var profile = profiles[i];
                //console.log(profile.name);
                $('#e2').append('<option value="'+i+'">'+profile.name+'</option>');

                if (profile.name == selected_profile_name)
                {
                    selected_profile = i;
                    $('#e2').select2('val', i);
                    updateProfile(i);
                }
            }
        };


        $("#e2").select2(
        {
            placeholder: "Select Profile",
            allowClear: true,
            minimumResultsForSearch: -1
        });


        $("#e2").on("change", function(e)
        {
            updateProfile(e.val);
        });

    }
});
