$exe = 'C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe'
$ini = 'C:\ProgramData\MySQL\MySQL Server 8.4\my.ini'
$cmd = "`"$exe`" --defaults-file=`"$ini`" --console"
$res = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{CommandLine = $cmd}
Write-Output $res
Start-Sleep -Seconds 2
Get-Process mysqld -ErrorAction SilentlyContinue
