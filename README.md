

After building docker container for the first time build db in ruby

`docker-compose exec app bundle exec rake db:setup db:migrate`

From step 4: https://www.digitalocean.com/community/tutorials/containerizing-a-ruby-on-rails-application-for-development-with-docker-compose#step-4-defining-services-with-docker-compose