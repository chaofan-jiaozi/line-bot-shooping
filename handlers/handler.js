const { LineHandler } = require('bottender')
const queryString = require('query-string')
const handleGeneralFlow = require('./handle_general_flow.js')
const handleShoppingFlow = require('./handle_shopping_flow.js')

const _ = require('lodash')

const init = context => {
  const {event} = context
  console.log(`\n`)
  if (event.isText) console.log(`user input: ${event.text}`)
  if (event.isPostback) {
    console.log(`postback: ${JSON.stringify(event.postback)}`)
    event.postback['query'] = queryString.parse(event.postback.data)
    console.log('postback.query:', event.postback.query)
  }
  console.log(`handler, first state: `, context.state)
  return false
}

const isReset = context => {
  const { event } = context
  if (event.isText && (event.text === 'reset' || event.text === 'Reset')) {
    return true
  }
  return false
}

const handleReset = context => {
  context.resetState()
  console.log(`handler, final state: `, context.state)
}

const isGeneralFlow = context => {
  const {event} = context
  if (event.isPostback) {
    if (event.postback.query && event.postback.query.flow === 'general') return true
  }
  return false
}

const isShoppingFlow = context => {
  const {event} = context
  if (event.isPostback) {
    if (event.postback.query && event.postback.query.flow === 'shopping') return true
  }
  if (_.startsWith(context.state.flow, 'shopping')) return true
  return false
}

module.exports = new LineHandler()
  .on(init, context => console.log(`How do you get here!?`))
  .on(isReset, handleReset)
  .on(isGeneralFlow, handleGeneralFlow)
  .on(isShoppingFlow, handleShoppingFlow)
  .onEvent(context => {
    console.log('Uncaught event:', context.event.rawEvent)
  })
  .build()