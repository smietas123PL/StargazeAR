$ErrorActionPreference = "Stop"

function Step($msg) {
    Write-Host "[STEP] $msg" -ForegroundColor Cyan
}

function Ok($msg) {
    Write-Host "[OK] $msg" -ForegroundColor Green
}

function Warn($msg) {
    Write-Host "[WARN] $msg" -ForegroundColor Yellow
}

function Fail($msg) {
    Write-Host "[FAIL] $msg" -ForegroundColor Red
    exit 1
}

Write-Host "=== FULL RESET START ===" -ForegroundColor Yellow

# CONFIG
$projectRoot = Get-Location
$adbPath = "C:\Users\grzeg\ADB_Fastboot\platform-tools\adb.exe"
$apkPath = Join-Path $projectRoot "android\app\build\outputs\apk\debug\app-debug.apk"
$localPropertiesPath = Join-Path $projectRoot "android\local.properties"
$gradlePropertiesPath = Join-Path $projectRoot "android\gradle.properties"
$packageName = "com.smietaspl.stargazear"
$mainActivity = ".MainActivity"
$javaHome = "C:\Program Files\Android\Android Studio\jbr"

# 1. Kill processes that often lock files
Step "Killing Metro / Node / Java / Gradle processes"
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process java -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process javaw -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process gradle -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# 2. Remove node_modules and lock file (robust Windows-safe mode)
Step "Removing node_modules and package-lock.json"
if (Test-Path "node_modules") {
    try {
        Remove-Item -Recurse -Force -ErrorAction Stop "node_modules"
        Ok "node_modules removed"
    } catch {
        Warn "Standard remove failed, using robocopy fallback"

        $emptyDir = Join-Path $projectRoot "__empty__"

        if (Test-Path $emptyDir) {
            Remove-Item -Recurse -Force $emptyDir -ErrorAction SilentlyContinue
        }

        New-Item -ItemType Directory -Path $emptyDir -Force | Out-Null
        robocopy $emptyDir (Join-Path $projectRoot "node_modules") /MIR | Out-Null
        Remove-Item -Recurse -Force $emptyDir -ErrorAction SilentlyContinue
        Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue

        if (Test-Path "node_modules") {
            Fail "Could not fully remove node_modules"
        } else {
            Ok "node_modules removed via fallback"
        }
    }
}

if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json" -ErrorAction SilentlyContinue
    Ok "package-lock.json removed"
}

# 3. Clean npm cache
Step "Cleaning npm cache"
npm cache clean --force
if ($LASTEXITCODE -ne 0) {
    Fail "npm cache clean failed"
}
Ok "npm cache cleaned"

# 4. Install dependencies
Step "Installing dependencies"
npm install
if ($LASTEXITCODE -ne 0) {
    Fail "npm install failed"
}
Ok "Dependencies installed"

# 5. Rebuild native project
Step "Running Expo prebuild --clean"
npx expo prebuild --clean
if ($LASTEXITCODE -ne 0) {
    Fail "expo prebuild --clean failed"
}
Ok "Expo prebuild finished"

# 6. Ensure Android SDK path exists
Step "Ensuring android/local.properties exists"
$androidSdk = $env:ANDROID_HOME
if (-not $androidSdk) {
    $androidSdk = $env:ANDROID_SDK_ROOT
}
if (-not $androidSdk) {
    $androidSdk = "$env:LOCALAPPDATA\Android\Sdk"
}

if (!(Test-Path $androidSdk)) {
    Warn "Android SDK path not found at: $androidSdk"
    Warn "If Gradle fails, set ANDROID_HOME or ANDROID_SDK_ROOT correctly."
}
$androidSdkForGradle = $androidSdk -replace '\\', '/'
"sdk.dir=$androidSdkForGradle" | Out-File -FilePath $localPropertiesPath -Encoding ascii -Force
Ok "local.properties written"

# 7. Set Java runtime
Step "Setting Java runtime"
if (!(Test-Path $javaHome)) {
    Fail "Java not found at: $javaHome"
}

$env:JAVA_HOME = $javaHome
$env:Path = "$env:JAVA_HOME\bin;$env:Path"

java -version
if ($LASTEXITCODE -ne 0) {
    Fail "java -version failed"
}
Ok "JAVA_HOME set to $env:JAVA_HOME"

# 8. Ensure Gradle also uses the same Java
Step "Ensuring android/gradle.properties contains org.gradle.java.home"
if (!(Test-Path $gradlePropertiesPath)) {
    New-Item -ItemType File -Path $gradlePropertiesPath -Force | Out-Null
}

$gradlePropertiesContent = Get-Content $gradlePropertiesPath -ErrorAction SilentlyContinue
$javaHomeEscapedForGradle = $javaHome -replace '\\', '\\'

if ($gradlePropertiesContent -notmatch '^org\.gradle\.java\.home=') {
    Add-Content -Path $gradlePropertiesPath -Value "org.gradle.java.home=$javaHomeEscapedForGradle"
    Ok "Added org.gradle.java.home to gradle.properties"
} else {
    $updated = $false
    $newLines = @()

    foreach ($line in $gradlePropertiesContent) {
        if ($line -match '^org\.gradle\.java\.home=') {
            $newLines += "org.gradle.java.home=$javaHomeEscapedForGradle"
            $updated = $true
        } else {
            $newLines += $line
        }
    }

    if ($updated) {
        Set-Content -Path $gradlePropertiesPath -Value $newLines -Encoding ascii
        Ok "Updated org.gradle.java.home in gradle.properties"
    }
}

# 9. Gradle clean
Step "Running Gradle clean"
Push-Location "android"

$env:JAVA_HOME = $javaHome
$env:Path = "$env:JAVA_HOME\bin;$env:Path"

.\gradlew.bat clean
if ($LASTEXITCODE -ne 0) {
    Pop-Location
    Fail "gradlew clean failed"
}
Ok "Gradle clean finished"

# 10. Build debug APK
Step "Building debug APK"
$env:JAVA_HOME = $javaHome
$env:Path = "$env:JAVA_HOME\bin;$env:Path"

.\gradlew.bat assembleDebug
if ($LASTEXITCODE -ne 0) {
    Pop-Location
    Fail "gradlew assembleDebug failed"
}
Pop-Location
Ok "APK build finished"

# 11. Check APK exists
Step "Checking APK output"
if (!(Test-Path $apkPath)) {
    Fail "APK not found at: $apkPath"
}
Ok "APK found: $apkPath"

# 12. Check ADB
Step "Checking ADB"
if (!(Test-Path $adbPath)) {
    Fail "ADB not found at: $adbPath"
}
Ok "ADB found"

# 13. Check connected device
Step "Checking connected Android device"
$adbDevices = & $adbPath devices
$connected = $adbDevices | Select-String "`tdevice$"

if (-not $connected) {
    Fail "No authorized Android device detected. Run '$adbPath devices' and confirm USB debugging on the phone."
}
Ok "Android device detected"

# 14. Install APK
Step "Installing APK on phone"
& $adbPath install -r $apkPath
if ($LASTEXITCODE -ne 0) {
    Fail "APK install failed"
}
Ok "APK installed successfully"

# 15. Launch app
Step "Launching app on phone"
& $adbPath shell am start -n "$packageName/$mainActivity"
if ($LASTEXITCODE -ne 0) {
    Warn "App installed, but launch command failed. You can open it manually on the phone."
} else {
    Ok "App launched on phone"
}

Write-Host "=== FULL RESET COMPLETE ===" -ForegroundColor Green
Write-Host "Now run Metro with: npx expo start" -ForegroundColor Cyan