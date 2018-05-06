Rails.application.routes.draw do

  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html
  root to: "welcome#index"

  get 'free_cell/play'
  get 'free_cell/play/:id', to: 'free_cell#play'
  get 'free_cell/create'
  post 'free_cell/create'
  get 'free_cell/cancel'

  get 'access/options'
  post 'access/options'

  get 'access/register'
  post 'access/register'
  get 'access/menu'
  get 'access/login'
  post 'access/attempt_login'
  get 'access/logout'


  get '/purge', to: 'welcome#purge'
  get '/help', to: 'welcome#help'

  mount ActionCable.server => "/cable"
end

