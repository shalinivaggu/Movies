const express = require('express')
const app = express()

const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

app.use(express.json())
const dbPath = path.join(__dirname, 'moviesData.db')
let db = null

const initializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server started...')
    })
  } catch (e) {
    console.log(`error found ${e.message}`)
    process.exit(1)
  }
}

initializeDBandServer()

const convertIntoMovieName = dbObject => {
  return {
    movieName: dbObject.movie_name,
  }
}

app.get('/movies/', async (request, response) => {
  const getMovieDetails = `select movie_name as movieName from movie;`
  const movieArray = await db.all(getMovieDetails)
  response.send(movieArray)
})

app.post('/movies/', async (request, response) => {
  const movieDetails = request.body
  const {directorId, movieName, leadActor} = movieDetails
  const addMovieQuery = `
  insert into movie(director_id , movie_name , lead_actor)
  values(${directorId} , '${movieName}' , '${leadActor}');
  `
  const dbresponse = await db.run(addMovieQuery)
  const movieId = dbresponse.lastID
  response.send('Movie Successfully Added')
})

app.get('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params

  const getMovieQuery = `
  select movie_id , director_id , movie_name , lead_actor
  from movie where movie_id = ${movieId};
  `

  const dbresponse = await db.get(getMovieQuery)
  const result = {
    movieId: dbresponse.movie_id,
    directorId: dbresponse.director_id,
    movieName: dbresponse.movie_name,
    leadActor: dbresponse.lead_actor,
  }
  response.send(result)
})

app.put('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const movieDetails = request.body
  const {directorId, movieName, leadActor} = movieDetails

  const updateQuery = `
  update movie 
  set
    director_id = ${directorId},
    movie_name ='${movieName}' ,
    lead_actor = '${leadActor}'
  where 
    movie_id = ${movieId};
  `

  await db.get(updateQuery)
  response.send('Movie Details Updated')
})

app.delete('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params

  const deleteQuery = `
  delete from movie
  where movie_id = ${movieId};
  `

  await db.all(deleteQuery)

  response.send('Movie Removed')
})

const convertIntoResult = dbObject => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  }
}

app.get('/directors/', async (request, response) => {
  const getDirectorDetails = `
  select * from  director;
  `

  const dbresponse = await db.all(getDirectorDetails)

  const result = dbresponse.map(eachDirector => convertIntoResult(eachDirector))
  response.send(result)
})

app.get('/directors/:directorId/movies/', async (request, response) => {
  const {directorId} = request.params
  const movieDetails = `
    SELECT movie_name FROM movie 
    INNER JOIN director ON movie.director_id = director.director_id
    WHERE movie.director_id = ${directorId};`
  const dbresponse = await db.all(movieDetails)
  const movieNames = dbresponse.map(eachMovie =>
    convertIntoMovieName(eachMovie),
  )
  response.send(movieNames)
})
module.exports = app
