@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0..\backend"

set "SPEC=%TEMP%\waterzone-convex-spec.json"
echo Fetching function spec from linked deployment...
npx.cmd convex function-spec > "%SPEC%" 2>nul
if errorlevel 1 (
  echo ERROR: convex function-spec failed. Is backend linked to zany-wildcat-447?
  exit /b 1
)

echo.
echo Verifying mobile Convex APIs...
set MISSING=0
for %%f in (
  users.js:createUser
  users.js:updateProfile
  drivers.js:ensureDemoDriver
  drivers.js:getByUserId
  drivers.js:listOnline
  drivers.js:updateStatus
  drivers.js:getStatus
  drivers.js:updateVehicle
  drivers.js:generateUploadUrl
  drivers.js:getEarningsSummary
  orders.js:createOrder
  orders.js:assignDriver
  orders.js:listByCustomer
  orders.js:get
  orders.js:acceptOrder
  orders.js:setEnroute
  orders.js:markDelivered
  orders.js:quickReorder
  orders.js:attachDeliveryProof
  orders.js:listByDriver
  addresses.js:listByUser
  addresses.js:create
  addresses.js:remove
  pricing.js:listBundles
  pricing.js:preview
  wallets.js:getWallet
  wallets.js:createWallet
  wallets.js:listTransactions
  notifications.js:listByUser
  notifications.js:markRead
  contracts.js:createDraft
  contracts.js:listByCustomer
  contracts.js:pause
  contracts.js:cancel
  contracts.js:updateContact
  contracts.js:activate
  payments.js:createIntent
  payments.js:markIntentPaid
  ratings.js:submit
  payouts.js:requestPayout
  payouts.js:ensureDriverWallet
  commissions.js:getDriverSummary
  commissions.js:listMySettlements
  commissions.js:submitPayment
) do (
  findstr /C:"%%f" "%SPEC%" >nul
  if errorlevel 1 (
    echo [MISSING] %%f
    set /a MISSING+=1
  ) else (
    echo [OK] %%f
  )
)

del "%SPEC%" 2>nul
echo.
if !MISSING! GTR 0 (
  echo FAILED: !MISSING! function^(s^) missing. Run: cd backend ^&^& npx convex dev --once
  exit /b 1
)
echo All 44 mobile API functions found on deployment.
endlocal
