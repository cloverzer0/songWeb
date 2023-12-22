const url = require('url')
const fs = require('fs')
const { sign } = require('crypto')
const { log } = require('console')
const exp = require('constants')
const sqlite3 = require('sqlite3').verbose() //verbose provides more detailed stack trace
const db = new sqlite3.Database('data/db_1200iRealSongs')

const signUpFilePath = __dirname + '/signUp.html'
const mainFilePath = __dirname + '/main.html'

function handleError(response, err) {
    //report file reading error to console and client
    console.log('ERROR: ' + JSON.stringify(err))
    //respond with not found 404 to client
    response.writeHead(404)
    response.end(JSON.stringify(err))
}

exports.authenticate = function(request, response, next) {
  /*
	Middleware to do BASIC http 401 authentication
	*/
  let auth = request.headers.authorization
  // auth is a base64 representation of (username:password)
  //so we will need to decode the base64
  if (!auth) {
    //note here the setHeader must be before the writeHead
    response.setHeader('WWW-Authenticate', 'Basic realm="need to login"')
    response.writeHead(401, {
      'Content-Type': 'text/html'
    })
    console.log('No authorization found, send 401.')
    response.end();
  } else {
    console.log("Authorization Header: " + auth)
    //decode authorization header
    // Split on a space, the original auth
    //looks like  "Basic Y2hhcmxlczoxMjM0NQ==" and we need the 2nd part
    var tmp = auth.split(' ')

    // create a buffer and tell it the data coming in is base64
    var buf = Buffer.from(tmp[1], 'base64');

    // read it back out as a string
    //should look like 'ldnel:secret'
    var plain_auth = buf.toString()
    console.log("Decoded Authorization ", plain_auth)

    //extract the userid and password as separate strings
    var credentials = plain_auth.split(':') // split on a ':'
    var username = credentials[0]
    var password = credentials[1]
    var retrieved_role 

    var authorized = false
    var admin = false

    //check database users table for user
    db.all("SELECT userid, password, role FROM users", function(err, rows) {
      for (var i = 0; i < rows.length; i++) {
        if (rows[i].userid == username & rows[i].password == password) {
          retrieved_role = rows[i].role
          console.log("User: " + username + " Role: " + retrieved_role)
          if(retrieved_role == 'admin'){
            admin = true
            request.admin = admin
          }
          request.user_role = retrieved_role
          request.userid = username
          authorized = true
        }
      }
      if (authorized == false) {
        //we had an authorization header by the user:password is not valid
        response.setHeader('WWW-Authenticate', 'Basic realm="need to login"')
        response.writeHead(401, {
          'Content-Type': 'text/html'
        })
        console.log('No authorization found, send 401.')
        response.end()
      } else
        next()
    })
  }
}

exports.signUp = function(req, res, next) {
    fs.readFile(signUpFilePath, function(err, data) {
        if (err) {
            handleError(res, err)
            return;
        }
        res.write(data)
        res.end()
    })
}

exports.signUpPost = function(req, res, next) { 
    var username = req.body.username
    var password = req.body.password
    var retrieved_role 

    var authorized = false
    var admin = false
    console.log("SIGN UP POST")
    //check database users table for user
    db.all("SELECT userid, password, role FROM users", function(err, rows,) {
      for (var i = 0; i < rows.length; i++) {
        if (rows[i].userid == username & rows[i].password == password) {
          retrieved_role = rows[i].role
          if(retrieved_role == 'admin'){
            admin = true
            req.admin = admin
          }
          req.user_role = retrieved_role
          authorized = true
        }
      }
      if (authorized == false) {
        //we had an authorization header by the user:password is not valid
        db.run(`insert into users values ('${username}', '${password}', 'guest')`)
        next()
      } else{
        res.write(`<h1>Welcome</h1>`)
        res.write(`<a href="/main">Main</a>`)
        res.end()
      }
    })
}
  
  function parseURL(request, response) {
    const PARSE_QUERY = true //parseQueryStringIfTrue
    const SLASH_HOST = true //slashDenoteHostIfTrue
    let urlObj = url.parse(request.url, PARSE_QUERY, SLASH_HOST)
    console.log('path:')
    console.log(urlObj.path)
    console.log('query:')
    console.log(urlObj.query)
    return urlObj
  }
  
  exports.users = function(request, response) {
    // /send_users
    db.all("SELECT userid, password FROM users", function(err, rows) {
      if(request.admin==true){
        if (err) {
            handleError(response, err);
            return;
        }
        response.render('users', {title : 'Users:', userEntries: rows});
      }
      else{
        response.write(`<h1>ERROR: Admin Privileges Required To See User</h1>`)
        response.end()
      }
    })
  
  }
  
  exports.find = function(request, response) {
    // /songs?title=Girl
    console.log("RUNNING FIND SONGS")
  
    let urlObj = parseURL(request, response);
    console.log("urlObj.query['title']: " + urlObj.query['title']);
    let sql = "SELECT id, title FROM songs";
  
    if (urlObj.query['title']) {
      console.log("finding title: " + urlObj.query['title']);
      let arr = urlObj.query['title'].replace(" ", "%")
      sql = "SELECT id, title FROM songs WHERE title LIKE '%" +
        arr + "%'";
    }
  
    db.all(sql, function(err, rows) {
        if (err) {
            handleError(response, err);
            return;
          }
        response.render('songs', {title: 'Songs:', songEntries: rows});
    })
  }

  exports.songDetails = function(request, response) {
    // /song/235
    let urlObj = parseURL(request, response)
    let songID = urlObj.path
    songID = songID.substring(songID.lastIndexOf("/") + 1, songID.length)
  
    let sql = "SELECT id, title, composer, key, bars FROM songs WHERE id=" + songID
    console.log("GET SONG DETAILS: " + songID)
  
    db.all(sql, function(err, rows){
        if (err) {
            handleError(response, err);
            return;
          }
        let song = rows[0];
        let bars = song.bars.split(/(\|\||\||\|\])/)
        .filter(bar => bar !== '' && bar !== '|' && bar !== '||' && bar !== '|]');
        song.individualBars = [];
        song.bars = [];
        array= [];
        for(let i=0; i < bars.length; i++){
            if(bars[i] !== ']'){
                array.push(bars[i]);
                if(array.length == 4){
                    song.individualBars.push(array);
                    array = [];
                }
            }
            if(i==bars.length-1){
                song.individualBars.push(array);
            }
        }
        console.log('Song Data');
        console.log(song);
        response.render('songDetails', {title: 'Songs Details:', song: song});
    });
  }
  exports.main = function(request, response) {
    // index.html
    fs.readFile(mainFilePath, function(err, data) {
      if (err) {
        handleError(response, err);
        return;
      }
      response.write(data)
    })
  }

exports.playlist = function(request, response) {
    // /playlist
    let sql = "SELECT id, title FROM playlist WHERE userid='" + request.userid + "'";
    db.all(sql, function(err, rows) {
      console.log(rows);
        if (err) {
            handleError(response, err);
            return;
          }
        response.render('playlist', {title: 'Songs:', songEntries: rows});
    })
}

exports.add = function(request, response) {
    // /add
    console.log("ADD SONG TO PLAYLIST")
    let songID;
    songID = request.body.songId
  
    let sql = "SELECT id, title, composer, key, bars FROM songs WHERE id=" + songID
    console.log("GET SONG DETAILS: " + songID)
    let song;

    db.all(sql, function(err, rows){
        if (err) {
            handleError(response, err);
            return;
          }
        song = rows[0];
        let bars = song.bars.split(/(\|\||\||\|\])/)
        .filter(bar => bar !== '' && bar !== '|' && bar !== '||' && bar !== '|]');
        song.individualBars = [];
        song.bars = [];
        array= [];
        for(let i=0; i < bars.length; i++){
            if(bars[i] !== ']'){
                song.bars.push(bars[i]);
                array.push(bars[i]);
                if(array.length == 4){
                    song.individualBars.push(array);
                    array = [];
                }
            }
            if(i==bars.length-1){
                song.individualBars.push(array);
            }
        }
        console.log('Song Data');
        console.log(song);
        let sql2 = "INSERT INTO playlist (userid, id, title, composer, key, bars) VALUES ('" + request.userid + "', '" + song.id + "', '" + song.title + "', '" + song.composer + "', '" + song.key + "', '" + song.bars + "')";
        db.run(sql2, function(err) {
            if (err) {
                handleError(response, err);
                return;
              }
            console.log("INSERTED INTO PLAYLIST");
        });
    });
}