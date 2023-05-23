const {LineHandler} = require('bottender')
const _ = require('lodash')
const Product = require('../database/product.js')
const handleGeneralFlow = require('./handle_general_flow.js')

const isBuy = context => {
  const {event} = context
  if (event.isPostback && event.postback.query && event.postback.query.action === 'buy') return true
  return false
}

const handleBuy = async context => {
  console.log('handle_shopping_flow, handleBuy')
  const {productID} = context.event.postback.query
  if (!productID) return console.log('there is no productID in postback!')
  const product = await Product.readProduct({id: productID})
  if (!product || !product.isShow) return context.replyText('不好意思，已經買不到囉')
  context.setState({flow: 'shopping_wait_input', order: {productID: product.id}})
  context.replyText(`想買${product.name}幾個呢？ (請輸入1~9)`)
  console.log('handle_shopping_flow, ask how many do u want')
  console.log('handle_shopping_flow, final state: ', context.state)
}

const isWaitInputQuantityState = context => {
  if (context.state.flow === 'shopping_wait_input') return true
  return false
}

const cancelBuy = async context => {
  console.log('handle_shopping_flow, cancelBuy')
  context.setState({flow: null, order: null})
  context.pushText('先幫您取消囉')
  console.log('handle_shopping_flow, reply cancel')
  console.log('handle_shopping_flow, final state: ', context.state)
  return(handleGeneralFlow(context))
}

const handleWaitInputQuantityState = async context => {
  console.log('handle_shopping_flow, handleWaitInputQuantityState')
  const {event} = context
  if (!event.isText || !/\d{1,}/g.test(event.text)) {
    context.replyText('我看不懂，請再輸入一次')
    console.log('handle_shopping_flow, reply just know number')
    console.log('handle_shopping_flow, final state: ', context.state)
    return
  }
  const quantity = _.toInteger(event.text)
  if (quantity === 0) return cancelBuy(context)
  const product = await Product.readProduct({id: context.state.order.productID})
  if (!product || !product.isShow) return context.replyText('不好意思，已經買不到囉')
  context.state.order['quantity'] = quantity
  context.state.flow = 'shopping_wait_confirm'
  context.reply([
    {
      type: 'flex',
      altText: '訂單確認',
      contents: {
        type: 'bubble',
        hero: {
          type: "image",
          url: product.imgUrl,
          size: "full",
          aspectRatio: "1:1",
          aspectMode: "fit",
        },
        body: {
          type: 'box',
          layout: 'vertical',
          spacing: "sm",
          contents: [
            {
              type: "text",
              text: '請確認一下',
              wrap: true,
              weight: "bold",
              size: "xl"
            },
            {
              type: "text",
              text: `您想要購買 ${product.name} ${quantity} 個，是嗎？`,
              wrap: true,
              size: "xl",
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
                label: "沒錯！",
                displayText: "沒錯！",
                data: `flow=shopping&action=confirm`
              }
            },
            {
              type: "button",
              style: "link",
              height: "md",
              action: {
                type: "postback",
                label: "不對～",
                displayText: "不對～",
                data: `flow=shopping&action=cancel`
              }
            }
          ]
        }
      }
    }
  ])
  console.log('handle_shopping_flow, reply order')
  console.log('handle_shopping_flow, final state: ', context.state)
}

const isWaitConfirm = context => {
  if (context.state.flow === 'shopping_wait_confirm') return true
  return false
}

const handleWaitConfirm = context => {
  console.log('handle_shopping_flow, handleWaitConfirm')
  const {event} = context
  if (event.isPostback && event.postback.query && event.postback.query.action === 'confirm') {
    context.setState({flow: null, order: null})
    context.replyText('購買資訊已確認')
  }
  if (event.isPostback && event.postback.query && event.postback.query.action === 'cancel') {
    cancelBuy(context)
  }
}

module.exports = new LineHandler()
  .on(isBuy, handleBuy)
  .on(isWaitInputQuantityState, handleWaitInputQuantityState)
  .on(isWaitConfirm, handleWaitConfirm)
  .onEvent(context => console.log('Uncaught event:', context.event.rawEvent))
  .build()