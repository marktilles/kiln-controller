#!/bin/sh
/usr/bin/gpio -g mode 27 out

in="$1";

# Send WhatsApp Message to marks phone
#runuser -l pi -c 'yowsup-cli demos  --config-pushname "Drejstugan" -c /home/pi/yowsup/config -s 46730264112 "Door has been opened for entry." > /tmp/yowsup.log 2>&1 &'

runuser -l pi -c 'yowsup-cli demos  --config-pushname Drejstugan --config-phone 46707805404 --config-client_static_keypair WEhLKT6gcGYiiVd8TFb2/NTe4WRwdw6VmNwACfnhMWrEYDpWmaAW/NsD/49qfa6EcGiWh62padVRSmCfSBmELg== -s 46730264112 "Door has been opened for entry." > /tmp/yowsup.log 2>&1 &'

#runuser -l pi -c 'yowsup-cli demos  --config-pushname Drejstugan --config-phone 46707805404 --config-client_static_keypair WEhLKT6gcGYiiVd8TFb2/NTe4WRwdw6VmNwACfnhMWrEYDpWmaAW/NsD/49qfa6EcGiWh62padVRSmCfSBmELg== -s 46730264112 $in > /tmp/yowsup.log 2>&1 &'

# Unlock door
/usr/bin/gpio -g write 27 1;
# Pause 10 seconds
sleep 10;
# Lock door again
/usr/bin/gpio -g write 27 0 


