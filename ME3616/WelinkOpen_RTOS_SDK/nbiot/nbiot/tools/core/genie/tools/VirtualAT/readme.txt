The Genie tool - VirtualAT requires com0com virtual serial port emulator to be installed. 

Download and install the 3.0.0.0 signed version x64 from https://sourceforge.net/projects/com0com/files/com0com/    [com0com-3.0.0.0-i386-and-x64-signed.zip]

After initial installation of com0com: 
* Add port pair for Genie by running from com0com installation directory ("C:\Program Files (x86)\com0com") the following command:

 setupc.exe install PortName=COM_GENIE_VP,ExclusiveMode=yes,EmuOverrun=yes PortName=COM#,EmuBR=yes,PlugInMode=yes
  
Please note that after running the above command, a single Port will appear in Device manager (e.g. com0com - serial port emulator(COM...)). 
Only once VirtualAT is running and connected to this port, will its paired port (for use by external application) also appear in Device Manager.