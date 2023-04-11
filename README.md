

After building docker container for the first time build db in ruby.

Note: This command will reset the database if there is any data there currently

`docker-compose exec app bundle exec rake db:setup db:migrate`

From step 4: https://www.digitalocean.com/community/tutorials/containerizing-a-ruby-on-rails-application-for-development-with-docker-compose#step-4-defining-services-with-docker-compose


* Make sure `github` user on server has correct .ssh settings and permissions
* Add github actions deploy secrets to repo settings