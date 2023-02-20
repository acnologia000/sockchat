# agent_login
curl --header "Content-Type: application/json" --request POST --data '{"username":"xyz","password":"xyz"}' http://localhost:4000/login

#master login
curl --header "Content-Type: application/json" --request POST --data '{"username":"username","password":"password"}' http://localhost:5000/login


#create agent
curl --header "Content-Type: application/json" --request POST --data '{"username":"def","password":"def","token":"qARwjHt9OQo3NKKwON5QSOURT77FNv5rso32r7ukubqdNqKlLzII0PM5EArXXkFi"}' http://localhost:5000/create_agent