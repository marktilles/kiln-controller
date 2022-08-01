# PyMon.py
# Program to monitor GPIO pins on a raspberry pi
# can be run on the pi or a remote machine
# It uses pigpio and needs the pigpiod deamon 
# to be running on the target machine.
# Change the host variable to suit your needs.
# If you are running the monitor on the pi
# use 'localhost'
# written by Roger Woollett

# To run this script, manually sart pigpiod daemon as root or sudo
# sudo pigpiod <enter>
#

import sys

if(sys.version_info[0] < 3):
    import Tkinter as tk
    import ttk
    import tkMessageBox as mb
    import tkSimpleDialog as sd
else:    
    import tkinter as tk
    import tkinter.ttk as ttk
    import tkinter.messagebox as mb
    import tkinter.simpledialog as sd

import socket as s
import pigpio as pg

# pigpiod daemon location
# This really should be configured by user
host = 'localhost'
port = 8888

REFRESH_RATE = 200  # msec between updates
COLS = 5            # columns in display
TITLE = 'Python GPIO Monitor - '

# Pins to test (Broadcom,physical)
# N.B. this list is for B+ & A+ earlier pis do not have so many pins
pins = ((2,3),(3,5),(4,7),(5,29),(6,31),(7,26),(8,24),
        (9,21),(10,19),(11,23),(12,32),(13,33),(14,8),
        (15,10),(16,36),(17,11),(18,12),(19,35),(20,38),
        (21,40),(22,15),(23,16),(24,18),(25,22),(26,37),(27,13))

# character stings for modes
modes = ('INPUT','OUTPUT','ALT5','ALT4','ALT0','ALT1','ALT2','ALT3')

class Config(sd.Dialog):
    def __init__(self,master,msg,*args,**kwargs):
        
        self.msg = msg + '\nPress OK to reconfigure, Cancel to end\n'
        
        # body is called by base class __init__
        # so call it after self variables are set
        sd.Dialog.__init__(self,master,*args,**kwargs)
                        
    def body(self,master):
        # I am not sure why fist param is master not self
        ttk.Label(master,text = self.msg).grid(row = 0)
        ttk.Label(master,text = 'Host:').grid(row = 1,column = 0,sticky = tk.E)
        ttk.Label(master,text = 'Port:').grid(row = 2,column = 0,sticky = tk.E)
        
        global host
        self.s1 = tk.StringVar()
        self.s1.set(host)
        self.e1 = ttk.Entry(master,textvariable = self.s1)
        self.e1.grid(row = 1,column = 1)
        
        global port
        self.s2 = tk.StringVar()
        self.s2.set(port)
        self.e2 = ttk.Entry(master,textvariable = self.s2)
        self.e2.grid(row = 2,column = 1)
        
        return self.e1
        
    def apply(self):
        global host
        global port
        global restart
 
        host = self.e1.get()
        port = int(self.e2.get())
        restart = True
        
# A round 'light' that is red if the pin is high (on)
class Light(tk.Canvas):
    def __init__(self,master,*args,**kwargs):
        tk.Canvas.__init__(self,master,*args,**kwargs)
        
        self.id = self.create_oval(5,5,15,15,fill = 'white')
        
    def off(self):
        self.itemconfigure(self.id,fill = 'white')
        
    def on(self):
        self.itemconfigure(self.id,fill = 'red')
        
# A frame for the widgets that show one pin
class PinFrame(tk.Frame):
    def __init__(self,master,pin,phys,*args,**kwargs):
        tk.Frame.__init__(self,master,*args,**kwargs) 
        
        self.pin = pin
        self.mask = 1<<pin
        self.high = False
        self.mode = -1
        
        # create a label (shows GPIO with physical pin no in brackets)
        self.lab = ttk.Label(self,width = 11,
                             text = 'GPIO ' + str(self.pin) + '(' + str(phys) + ')')
        self.lab.grid(row = 0,column = 0)
        
        # create a label to show mode
        self.mode_text = tk.StringVar()
        self.mode_lab = ttk.Label(self,width = 7,textvariable = self.mode_text)
        self.mode_lab.grid(row = 0,column = 1)
        # create a Light
        self.light = Light(self,height = 20,width = 30)
        self.light.grid(row = 0,column = 2)
    
    # check to see if state has changed and switch light if needed             
    def check(self,mask):
        now = mask & self.mask
       
        if now != self.high:
            self.high = now
            if(now):
                self.light.on()
            else:
                self.light.off()
                
    def check_mode(self):
        mode = pi.get_mode(self.pin)
        if mode != self.mode:
            self.mode = mode
            self.mode_text.set(modes[mode])
    
# a Mainframe object contains the widgets that make up the user interface              
class Mainframe(tk.Frame):
    def __init__(self,master,*args,**kwargs):
        tk.Frame.__init__(self,master,*args,**kwargs)
        
        no = len(pins)
        self.pinframes = []
        
        # lay out the frames that show pin status
        i = 0
        row = 0
        while i < no:
            for col in range(COLS):
                if i < no:
                    pf = PinFrame(self,pins[i][0],pins[i][1])
                    pf.grid(row = row,column = col)
                    self.pinframes.append(pf)
                    i += 1
            row += 1
        
        # Button to refresh modes
        ttk.Button(self,text = 'Refresh modes',
                   command = self.getmodes).grid(row = 10,column = 0)
        
        # Button to change host
        ttk.Button(self,text = 'Change host',
                   command = master.restart).grid(row = 10,column = 1)
        # I like to have a quit button
        ttk.Button(self,text = 'Quit',
                   command = master.onQuit).grid(row = 10,column = 2)
        
        self.getmodes()
        self.getpins()
    
    # called every REFRESH_RATE msec to update the display
    def getpins(self):
        mask = pi.read_bank_1()
        
        for i in range(len(self.pinframes)):
            self.pinframes[i].check(mask)
            i += 1
            
        # set up the next call
        self.timerid = self.after(REFRESH_RATE,self.getpins)
        
    def getmodes(self):
        for i in range(len(self.pinframes)):
            self.pinframes[i].check_mode()
            i += 1

    def cleartimer(self):
        self.after_cancel(self.timerid)
        
# a single App object represents the program itself
# it has a Mainframe which handles the UI
class App(tk.Tk):
    def __init__(self):
        tk.Tk.__init__(self)
        
        # trap close (X) button so we can cleanup
        self.protocol('WM_DELETE_WINDOW',self.onQuit)
        self.window = None
        
        # do cosmetics to main window
        self.title(TITLE + host)
        
        # check to see if we can talk to the pigpio daemon
        if not self.checkdaemon(host,port):
            self.onQuit()
            return
        
        # if we get here we think all is well so create the pi object
        global pi        
        pi = pg.pi(host,port)
        
        self.window = Mainframe(self)
        self.window.grid()
        
    def checkdaemon(self,host,port):
        # check to see if the target machine is on the network
        # and the demon seems to be running
        # returns False if there is an error
        # first see if host is on network
        try:
            # n.b.on a raspberry pi this can take a long time to fail
            s.gethostbyname(host)
        except:
            # Hide the window
            self.withdraw()
            # show Config dialog
            Config(self,"Cannot find host " + host)
            # abort program
            return False
        else:
            # now see if daemon is running
            try:
                sock = s.create_connection((host,port))
            except:
                #mb.showerror('pigpio',"Daemon not running on" + host)
                self.withdraw()
                Config(self,"Daemon not running on port " + str(port))
                return False
            else:
                sock.close()
        return True
        
    # restart to change host
    def restart(self):
        global restart
        global host
        host = ''
        restart = True
        self.onQuit()
        
    # clean up and exit
    def onQuit(self):
        if self.window != None:
            self.window.cleartimer()
            
        self.destroy()
        if pi != None:
            pi.stop()

restart = True
while restart:
    restart = False
    # communicates with pigpiod running on the
    # raspberry pi.
    pi = None
    
    # create an App object and execute its main loop
    App().mainloop()

