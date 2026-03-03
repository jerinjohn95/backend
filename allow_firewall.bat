@echo off
echo Adding Windows Firewall rule for Node.js server on port 3000...
netsh advfirewall firewall delete rule name="Allow Node.js Server" >nul 2>&1
netsh advfirewall firewall add rule name="Allow Node.js Server" dir=in action=allow protocol=TCP localport=3000
if %ERRORLEVEL% EQU 0 (
    echo ✅ Firewall rule added successfully!
) else (
    echo ❌ Failed to add firewall rule. Please run as Administrator.
)
echo.
echo Press any key to continue...
pause >nul
