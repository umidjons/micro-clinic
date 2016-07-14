@echo off
SET MONGO_PATH=c:\Program Files\MongoDB\Server\3.2\bin\
SET CONFIG_FILE=mongod.cfg
CD /D %MONGO_PATH%
REM mongod.exe --config %CONFIG_FILE% -auth
mongod.exe --config %CONFIG_FILE%