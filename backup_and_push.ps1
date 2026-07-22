$backupDir = 'D:\PRJ301\Backup_22_7'
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
Copy-Item 'LucyBackendAPI\src\main\java\com\lucy\controller\UserServlet.java' -Destination $backupDir\
Copy-Item 'LucyBackendAPI\src\main\java\com\lucy\dao\UserDAO.java' -Destination $backupDir\
Copy-Item 'src\AdminApp.jsx' -Destination $backupDir\
Copy-Item 'src\App.jsx' -Destination $backupDir\
Copy-Item 'src\LoginPage.jsx' -Destination $backupDir\

git fetch origin
git reset --hard origin/main

Copy-Item "$backupDir\UserServlet.java" -Destination 'LucyBackendAPI\src\main\java\com\lucy\controller\UserServlet.java' -Force
Copy-Item "$backupDir\UserDAO.java" -Destination 'LucyBackendAPI\src\main\java\com\lucy\dao\UserDAO.java' -Force
Copy-Item "$backupDir\AdminApp.jsx" -Destination 'src\AdminApp.jsx' -Force
Copy-Item "$backupDir\App.jsx" -Destination 'src\App.jsx' -Force
Copy-Item "$backupDir\LoginPage.jsx" -Destination 'src\LoginPage.jsx' -Force

git add LucyBackendAPI\src\main\java\com\lucy\controller\UserServlet.java LucyBackendAPI\src\main\java\com\lucy\dao\UserDAO.java src\AdminApp.jsx src\App.jsx src\LoginPage.jsx
git commit -m "fix: integrate optimized PBKDF2 login and robust role management"
git push origin main
