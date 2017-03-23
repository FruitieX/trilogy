import Trilogy from '../dist/trilogy'

import test from 'ava'
import rimraf from 'rimraf'
import { join, basename } from 'path'

const filePath = join(__dirname, `${basename(__filename, '.js')}.db`)
const db = new Trilogy(filePath)

const people = [
  { name: 'Dale', age: 30 },
  { name: 'Lelu', age: 6 },
  { name: 'Gurlak', age: 302 }
]

test.before(async () => {
  await db.model('people', {
    name: String,
    age: Number
  })

  return Promise.all(people.map(person => db.create('people', person)))
})

test.after.always('remove test database file', () => {
  return db.close().then(() => rimraf.sync(filePath))
})

test.serial('decrements by 1 when no amount is provided', async t => {
  let values = await Promise.all(
    people.map(({ name, age }, i) => {
      people[i].age -= 1
      return db.decr('people.age', { name })
        .then(() => db.get('people.age', { name }))
        .then(val => [age, val])
    })
  )

  values.forEach(([age, val]) => t.is(val, age - 1))
})

test.serial('decrements by a specified amount', async t => {
  let values = await Promise.all(
    people.map(({ name, age }, i) => {
      people[i].age -= 4
      return db.decr('people.age', { name }, 4)
        .then(() => db.get('people.age', { name }))
        .then(val => [age, val])
    })
  )

  values.forEach(([age, val]) => t.is(val, age - 4))
})

test.serial('does not allow negative values when allowNegative is falsy', async t => {
  await db.create('people', { name: 'Benjamin Button', age: 100 })
  await db.decr('people.age', { name: 'Benjamin Button' }, 200)
  let res = await db.get('people.age', { name: 'Benjamin Button' })
  t.is(res, 0)
})

test.serial('allows negative values when allowNegative is truthy', async t => {
  await db.decr('people.age', { name: 'Lelu' }, 2, true)
  let res = await db.get('people.age', { name: 'Lelu' })
  t.is(res, -1)
})

test.serial('does nothing when passed a zero value', async t => {
  await db.decr('people.age', { name: 'Lelu' }, 0, true)
  let res = await db.get('people.age', { name: 'Lelu' })
  t.is(res, -1)
})
