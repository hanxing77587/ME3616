@echo off
rem This batch file will install com0com virtual com drivers. 
rem These drivers are used to provide a virutal COM port for applications to send AT commands 

set EXIT_CODE=0
set SETUP_PC_BIN=setupc.exe
set WORKING_DIR=%~sdp0

if "%PROCESSOR_ARCHITECTURE%"=="x86" (
	set SETUP_BIN=%WORKING_DIR%\setup_x86.exe
	set DESTINATION_FOLDER="C:\Program Files\com0com\"
)
if "%PROCESSOR_ARCHITECTURE%"=="AMD64" (
	set SETUP_BIN=%WORKING_DIR%\setup_x64.exe
	set DESTINATION_FOLDER="C:\Program Files (x86)\com0com\"
)

if exist "%DESTINATION_FOLDER%\%SETUP_PC_BIN%" goto install_virtual_com_only

if not exist %SETUP_BIN% goto errorMsg1

echo Installing drivers
"%SETUP_BIN%" /S 

:install_virtual_com_only
rem com0com already installed so only need to add virtual pair which are needed for VirtualAT.exe
c:
cd \
cd "%DESTINATION_FOLDER%"

if not exist %SETUP_PC_BIN% goto errorMsg2

rem Add port pair for Genie
rem The PortName has to start with 'COM' to fulfil 'implicit' requirement for serial port naming.
rem The configurations are such to only show the paired com port if VirtualAT.exe has opened COM_GENIE_VP
rem Also any data sent over to the paired com port (the one used by external application) will be ignored. 
rem In principle, this shouldn't occur as this paired port is only avaialble when VirtualAT.exe already
rem open the COM_GENIE_VP port.
echo Adding Virtual com pairs; Will only be visible in Device manager if VirtualAT has been started.
setupc.exe --detail-prms install HiddenMode=yes PortName=COM100,ExclusiveMode=yes
setupc.exe --detail-prms install HiddenMode=yes PortName=COM101,ExclusiveMode=yes
setupc.exe --detail-prms install HiddenMode=yes PortName=COM102,ExclusiveMode=yes
setupc.exe --detail-prms install HiddenMode=yes PortName=COM103,ExclusiveMode=yes
setupc.exe --detail-prms install HiddenMode=yes PortName=COM104,ExclusiveMode=yes
setupc.exe --detail-prms install HiddenMode=yes PortName=COM105,ExclusiveMode=yes
setupc.exe --detail-prms install HiddenMode=yes PortName=COM106,ExclusiveMode=yes
setupc.exe install PortName=COM_GENIE_VP,ExclusiveMode=yes,EmuOverrun=yes PortName=COM#,EmuBR=yes,PlugInMode=yes

if %ERRORLEVEL% == 1 goto errorMsg3

goto exit

:errorMsg1
echo Cannot find com0com setup installation here: %SETUP_BIN%
set EXIT_CODE=1
goto exit


:errorMsg2
echo com0com installation does not appear to have completed successfully.
echo Failed to find '%SETUP_PC_BIN%'
set EXIT_CODE=1
goto exit


:errorMsg3
echo
echo Drivers and COM_GENIE_VP already present. Nothing to do!
goto exit 


:exit
pause 
exit %EXIT_CODE%
