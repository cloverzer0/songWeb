/*
(c) 2022 Louis D. Nel

Basic express server with middleware and
SQLite database.

The server allows client to find
chord progressions of songs in
its SQLite database. The database provided
has chord progressions of some 1200
popular jazz standards.

********************************************************************
Here we do server side rendering WITHOUT a
template engine.
In This example partial HTML files are
"rendered" with data placed in between them:

header.html + data + footer.html
*********************************************************************
*/
const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const favicon = require('serve-favicon')
//read routes modules
const routes = require('./index')

const  app = express() //create express middleware dispatcher

const urlencodedParser = bodyParser.urlencoded({extended: false}) //use default qs library

const PORT = process.env.PORT || 3000


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs'); //use hbs handlebars wrapper

// view engine setup
//app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'hbs'); //use hbs handlebars wrapper

app.locals.pretty = true //to generate pretty view-source code in browser
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
app.get('/signup', routes.signUp)
app.post("/signup", urlencodedParser, routes.signUpPost)
app.use(routes.authenticate)



app.get('/users', routes.users)
app.get('/song/*', routes.songDetails)
app.get("/main", routes.main)
app.get("/find", routes.find)
app.get("/playlist", routes.playlist)
app.post("/add", urlencodedParser, routes.add)



//start server
app.listen(PORT, err => {
  if(err) console.log(err)
  else {
		console.log(`Server listening on port: ${PORT} CNTL:-C to stop`)
    console.log(`To Test:`)
		console.log('user: ldnel password: secret role: guest')
    console.log('User: Louis password: secret role: admin')
    console.log('http://localhost:3000/signup')
	}
})
