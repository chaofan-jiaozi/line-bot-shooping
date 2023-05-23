const {LineHandler} = require('bottender')
const Product = require('../database/product.js')
const _ = require('lodash')

const requiredParam = param => {
  const requiredParamError = new Error(`Required parameter, "${param}" is missing.`)
  // preserve original stack trace
  if (typeof Error.captureStackTrace === 'function') {
    Error.captureStackTrace(requiredParamError, requiredParam)
  }
  throw requiredParamError
}

const toBubble = product => {
  return {
    type: "bubble",
    hero: {
      type: "image",
      url: product.imgUrl,
      size: "full",
      aspectRatio: "1:1",
      aspectMode: "fit",
    },
    body: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        {
          type: "text",
          text: product.name,
          wrap: true,
          weight: "bold",
          size: "xl"
        },
        {
          type: "text",
          text: `$${product.price}`,
          wrap: true,
          weight: "bold",
          size: "xl",
          color: "#FF0000",
          align: "end"
        }
      ]
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "button",
          style: "link",
          height: "md",
          action: {
            type: "postback",
            label: "買買買",
            displayText: "買買買",
            data: `flow=shopping&action=buy&productID=${product.id}`
          }
        }
      ]
    }
  }
}


const toBubbles = (
  {
    products = requiredParam('products')
  } = {}) => {
  let bubbles = _.map(products, toBubble)
  return bubbles
}

const handleGetProducts = async context => {
  console.log('handle_general_flow, handleGetProducts')
  const products = await Product.readProducts()
  let carouselProducts = {
    type: 'flex',
    altText: 'flex 商品列表',
    contents: {
      type: 'carousel',
      contents: toBubbles(products)
    }
  }
  context.reply([carouselProducts])
  console.log(`handle_general_flow, reply products list`)
  console.log(`handle_general_flow, final state: `, context.state)
}

const isGetProducts = context => {
  const {event} = context
  if (event.isText) return true
  if (event.postback.query.action && (event.postback.query.action === 'getProducts' || event.postback.query.action === 'cancel')) return true
  return false
}

module.exports = new LineHandler()
  .on(isGetProducts, handleGetProducts)
  .onEvent(context => console.log('Uncaught event:', context.event.rawEvent))
  .build()
