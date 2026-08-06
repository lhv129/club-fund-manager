1. cp .env.example .env
2. php artisan key:generate
3. php artisan storage:link
4. composer require intervention/image
5. php artisan vendor:publish --provider="Tymon\JWTAuth\Providers\LaravelServiceProvider"
6. php artisan jwt:secret
7. Setup cronjob

step 1: crontab -e

step 2: * * * * * cd /path/to/project && php artisan schedule:run >> /dev/null 2>&1

step 3: crontab -l