const { request } = require("http")

app.get('/songs', (request, response) => {
    // /songs?title=Girl
    console.log("RUNNING FIND SONGS")
  
    let urlObj = parseURL(request, response);
    let sql = "SELECT id, title FROM songs";
  
    if (urlObj.query['title']) {
      console.log("finding title: " + urlObj.query['title']);
      let arr = urlObj.query['title'].replace(" ", "%")
      sql = "SELECT id, title FROM songs WHERE title LIKE '%" +
        arr + "%'";
    }
  
    db.all(sql, function(err, rows) {
      console.log('ROWS: ' + typeof rows)
      send_find_data(request, response, rows)
    })
})

app.get('/users', (request, response) => {
    // /send_users
    db.all("SELECT userid, password FROM users", function(err, rows) {
      if(request.admin==true){
        send_users(request, response, rows)
        console.log('USER ROLE: ' + request.user_role)
      }
      else{
        response.write(`<h1>ERROR: Admin Privileges Required To See User</h1>`)
        response.end()
      }
    })
  
})


app.get('/song/*', (request, response) => {
    // /song/235
    let urlObj = parseURL(request, response)
    let songID = urlObj.path
    songID = songID.substring(songID.lastIndexOf("/") + 1, songID.length)
  
    let sql = "SELECT id, title, composer, key, bars FROM songs WHERE id=" + songID
    console.log("GET SONG DETAILS: " + songID)
  
    db.all(sql, function(err, rows) {
      console.log('Song Details Data')
      send_song_details(request, response, rows)
    })
})

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

function send_users(request, response, rows) {
    /*
    This code assembles the response from two partial .html files
    with the data placed between the two parts
    This CLUMSY approach is done here to motivivate the need for
    template rendering. Here we use basic node.js file reading to
    simulate placing data within a file.
    */
    fs.readFile(headerFilePath, function(err, data) {
      if (err) {
        handleError(response, err);
        return;
      }
      response.writeHead(200, {
        'Content-Type': 'text/html'
      })
      response.write(data)
  
      //INSERT DATA
      for (let row of rows) {
        console.log(row)
        response.write(`<p>user: ${row.userid} password: ${row.password}</p>`)
      }
  
      fs.readFile(footerFilePath, function(err, data) {
        if (err) {
          handleError(response, err);
          return;
        }
        response.write(data)
        response.end()
      })
    })
}

function send_find_data(request, response, rows) {
    /*
    This code assembles the response from two partial .html files
    with the data placed between the two parts
    This CLUMSY approach is done here to motivivate the need for
    template rendering. Here we use basic node.js file reading to
    simulate placing data within a file.
    */
    //notice navigation to parent directory:
    fs.readFile(headerFilePath, function(err, data) {
      if (err) {
        handleError(response, err);
        return;
      }
      response.writeHead(200, {
        'Content-Type': 'text/html'
      })
      response.write(data)
  
      //INSERT DATA
      for (let row of rows) {
        response.write(`<p><a href= 'song/${row.id}'>${row.id} ${row.title}</a></p>`)
      }
  
      fs.readFile(footerFilePath, function(err, data) {
        if (err) {
          handleError(response, err);
          return;
        }
        response.write(data)
        response.end()
      })
    })
}
  
function send_song_details(request, response, rows) {
    /*
    This code assembles the response from two partial .html files
    with the data placed between the two parts
    This CLUMSY approach is done here to motivivate the need for
    template rendering. Here we use basic node.js file reading to
    simulate placing data within a file.
    */
    //notice navigation to parent directory:
    fs.readFile(headerFilePath, function(err, data) {
      if (err) {
        handleError(response, err);
        return;
      }
      response.writeHead(200, {
        'Content-Type': 'text/html'
      })
      response.write(data)
  
      //INSERT DATA
      for (let row of rows) {
        console.log(row)
        response.write(`<h1>Songs Details:</h1>`)
        response.write(`<h1>${row.id}: ${row.title} composer: ${row.composer}</h1>`)
        response.write(`<p>${row.bars}</p>`)
      }
  
      fs.readFile(footerFilePath, function(err, data) {
        if (err) {
          handleError(response, err);
          return;
        }
        response.write(data)
        response.end()
      })
    })
}