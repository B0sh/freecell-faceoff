# README

This README would normally document whatever steps are necessary to get the
application up and running.

Things you may want to cover:

* Ruby version

* System dependencies

* Configuration

* Database creation

* Database initialization

* How to run the test suite

* Services (job queues, cache servers, search engines, etc.)

* Deployment instructions

* ...

# REDIS Part

Using heroku's redis free tier forces expires :(, so the new solution is to use Redis Labs (https://redislabs.com) until that dissappears too. I don't think it would be that hard to run a redis server at Walden's World if it came down to that but reliability for freecell face off is definetly not a priority.