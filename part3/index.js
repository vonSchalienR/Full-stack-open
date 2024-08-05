require('dotenv').config()

const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/Person')
const app = express()

app.use(morgan(':method :url :status :res[content-length] - :response-time ms :content'))
app.use(express.json())
app.use(express.static('build'))
app.use(cors())

morgan.token('content', (request) =>
  request.method === 'POST' && request.body.name
    ? JSON.stringify(request.body)
    : null
)

app.get('/api/persons', (request, response) => {
  Person
    .find({})
    .then(persons => {
      response.json(persons)
    })
})

app.get('/api/persons/:id', (request, response, next) => {
  Person
    .findById(request.params.id)
    .then(person => {
      if (person) {
        response.json(person)
      } else {
        response.status(404).end()
      }
    })
    .catch(error => next(error))
})

app.get('/info', (request, response) => {
  const currentDate = new Date().toString()

  Person
    .find({})
    .then(persons => {
      response.send(
        `<div>
          <p>Phonebook has info for ${persons.length} people</p>
        </div>
        <div>
          <p>${currentDate}</p>
        </div>`
      )
    })
})

app.post('/api/persons', (request, response, next) => {
  const body = request.body

  const contact = new Person ({
    name: body.name,
    number: body.number,
  })

  contact
    .save()
    .then(savedPerson => savedPerson.toJSON())
    .then(savedAndFormattedNote => {
      response.json(savedAndFormattedNote)
    })
    .catch(error => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
  const body = request.body

  const contact = {
    name: body.name,
    number: body.number
  }

  Person
    .findByIdAndUpdate(request.params.id, contact, { new: true })
    .then(updatedPerson => {
      response.json(updatedPerson)
    })
    .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
  Person
    .findOneAndDelete({ id: request.params.id })
    .then(result => {
      response.status(204).end()
    })
    .catch(error => next(error))
})

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
  console.log(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })

  }

  next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})