:::::::::::::::: Visual Studio Code Portable Launcher Version 1.1 BY blackkitty ::::::::::::::::
@echo off
call:set_absolute_path USERPROFILE .\.portable\User
call:set_absolute_path APPDATA .\.portable\User\AppData\Roaming
call:set_absolute_path mingwbin .\.portable\MinGW\bin
set path=%mingwbin%;%path%
start Code.exe
exit

:set_absolute_path
for /f %%p in ("%2") do (set %1=%%~fp)
goto:eof