#!/usr/bin/env python
import time

from gpiozero import Button, LEDBoard
from signal import pause
import warnings, os, sys

#aux1_ledGPIO = 22
aux2_ledGPIO = 27
#aux1_led=LEDBoard(aux1_ledGPIO)
aux2_led=LEDBoard(aux2_ledGPIO)

#aux1_led.blink(on_time=2, off_time=2)
aux2_led.blink(on_time=2, off_time=2)

print "Blinking GPIO 27 ... for 24 hours or the next reboot."
#print "Blinking GPIOs 22 and 27 ... for 24 hours or the next reboot."
time.sleep (86400)

