#!/usr/bin/env python3
from gpiozero import Button, LEDBoard
from signal import pause
import warnings, os, sys

# GPIO VALUES NOT PIN NUMBERS
off_button_GPIO = 21
offtime = 6 
mintime = 1
red_ledGPIO = 26
green_ledGPIO = 6
    
def when_pressed():
    # start blinking with 1/2 second rate
    red_led.blink(on_time=0.25, off_time=0.25)
    #green_led.blink(on_time=0.25, off_time=0.25)

def when_released():
    # be sure to turn the LEDs off if we release early
    red_led.blink(on_time=1.25, off_time=5)
    #red_led.off()
    #green_led.blink(on_time=1, off_time=1)


def shutdown(b):
    p = b.pressed_time
    red_led.blink(on_time=0.25, off_time=0.25)
    if p > offtime:
    #    #sys.exit("SHUTTING DOWN THE SYSTEM, PLEASE WAIT...")
       red_led.off()
       #green_led.off()
       #green_led.on()
       os.system("sudo poweroff")
       #print("HELLO WORLD")
       sys.exit()

with warnings.catch_warnings():
    warnings.simplefilter("ignore")
    red_led = LEDBoard(red_ledGPIO)
    green_led= LEDBoard(green_ledGPIO)

# Start blinking on green LED
red_led.blink(on_time=1.25, off_time=5)
#green_led.blink(on_time=1, off_time=1)


btn = Button(off_button_GPIO, hold_time=mintime, hold_repeat=True)
btn.when_held = shutdown
btn.when_pressed = when_pressed
btn.when_released = when_released
pause()
