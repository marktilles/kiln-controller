from time import sleep
import RPi.GPIO as GPIO
#from neopixel import *

PIN = 27
GPIO.setmode(GPIO.BCM)
GPIO.setup(PIN, GPIO.OUT, initial=0)
buzz = GPIO.PWM(PIN,1)
#LED_COUNT = 8 * 6

#strip = Adafruit_NeoPixel(LED_COUNT, 18, 800000, 5, False, 16)
#strip.begin()

#def show_candle(pixel):
#    for n in range(pixel,pixel + 5):
#        strip.setPixelColor(n, Color(255,0,0))
#    for n in range(pixel+5,pixel + 7):
#        strip.setPixelColor(n, Color(0,255,0))
#    strip.show()

#def show_flames():
#    strip.setPixelColor(7, Color(255,200,10))
#    strip.setPixelColor(7+8, Color(255,200,10))
#    strip.setPixelColor(7+16, Color(255,200,10))
#    strip.setPixelColor(7+24, Color(255,200,10))
#    strip.setPixelColor(7+32, Color(255,200,10))
#    strip.setPixelColor(7+40, Color(255,200,10))
#    strip.show()

def pwm(freq,duty_cycle = 30):
    buzz.ChangeDutyCycle(duty_cycle)
    buzz.ChangeFrequency(freq)
    buzz.start(duty_cycle)
    
def frequency(freq):
    buzz.ChangeFrequency(freq)

def duty_cycle(duty_cycle):
    buzz.ChangeDutyCycle(duty_cycle)

def play_note(note, duration=0.5):
    freq = 0
    if note == 'C':
        freq = 262
    if note == 'D':
        freq = 294
    if note == 'E':
        freq = 330
    if note == 'F':
        freq = 349
    if note == 'G':
        freq = 392
    if note == 'A':
        freq = 440
    if note == 'B':
        freq = 494
    if note == 'C5':
        freq = 523
    if note == 'D5':
        freq = 587
    if note == 'E5':
        freq = 659
    if note == 'F5':
        freq = 698
    play_freq(freq,duration)

def play_freq(freq, duration=0.5):
    if freq > 0:
        pwm(freq)
    sleep(duration)
    buzz.stop()
    
#show_candle(0)
play_note('G', 0.3)
play_note('G', 0.3)
play_note('A')
play_note('G')
play_note('C5')
play_note('B')
play_note('')

#show_candle(8)
play_note('G', 0.3)
play_note('G', 0.3)
play_note('A')
play_note('G')
play_note('D5')
play_note('C5')
play_note('')

#show_candle(16)
play_note('G', 0.3)
play_note('G', 0.3)
play_note('G')
play_note('E5')
#show_candle(24)
play_note('C5')
play_note('B')
play_note('A')
play_note('')

#show_candle(32)
play_note('F5', 0.3)
play_note('F5', 0.3)
play_note('E5')
play_note('C5')
#show_candle(40)
play_note('D5')
play_note('C5')
play_note('')
#show_flames()

#sleep(2)
#for n in range(0, LED_COUNT):
#   strip.setPixelColor(n, Color(0,0,0))
#strip.show()

