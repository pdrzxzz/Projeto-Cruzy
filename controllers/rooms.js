const Room = require('../models/room')
const OpenAI = require('openai')
require('dotenv').config()

module.exports.showAllRooms = async(req, res, next) => {
  const rooms = await Room.find({owner: req.user.username});
  res.render('rooms/index', {rooms: rooms || []});
}

module.exports.showRoomCreation = async(req, res, next) => {
  res.render('rooms/new');
}

module.exports.createNewRoom = async(req, res, next) => {
  
  if(await Room.exists({name: req.body.name})){
    req.flash('error', 'This room name is already in use')
    return res.redirect('/rooms/new')
  }
  let {name, numWords} = req.body;
  if(!name){
    name = `Room${Date.now()}`
  }
  if(!numWords){
    numWords = 10;
  }
    
  const client = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY'],
  });

  async function main() {

    const chatCompletion = await client.chat.completions.create({
      messages: [{ role: 'user', content: `return a javascript array like this: 
  { 
    theme: '',
    themeArray:  
      [
        { word: '', clue: ''},
        { word: '', clue: ''},
        { word: '', clue: ''},
        { word: '', clue: ''},
      ]
  }

  the words "theme", "themeArray", "word" and "clue" must not be changed.
  fill the empty spaces of the inner array using ${req.body.numWords} lower-case words with theme ${req.body.theme} on Português(Brasil) language and/or add more objects as needed, example:

      [
          { word: 'apple', clue: 'A common red or green fruit that keeps the doctor away.' },
          { word: 'banana', clue: 'A long, yellow fruit that monkeys love.' },
          { word: 'cherry', clue: 'A small, red fruit often found on top of desserts.' },
          { word: 'grape', clue: 'A small, round fruit that can be green or purple and used to make wine.' },
          { word: 'mango', clue: 'A tropical fruit with a sweet, orange flesh and a large seed.' },
          { word: 'orange', clue: 'A citrus fruit known for its vitamin C and juice.' },
          { word: 'strawberry', clue: 'A red fruit with seeds on the outside, often used in shortcakes.' },
          { word: 'pineapple', clue: 'A tropical fruit with a spiky exterior and sweet, yellow flesh.' }
      ]

  if the theme provided does not correspond to a valid theme, use a random theme and fill the "theme" key with the theme you choose, example: theme: 'food'
  if the theme provided correspond to a valid theme, use it and fill the "theme" key with the theme corresponding, example: theme: 'animals'

  MAKE IT THE HARDER AND SPECIFIC YOU CAN.
  THE CLUES ARE MEANT TO BE SHORT.
  DO NOT RETURN NOTHING ELSE
    
      `}],
      model: 'gpt-4o',
    });

    let response = chatCompletion.choices[0].message.content.replace('```javascript', '')
    response = response.replace('```', '')

    console.log('response: ', response)

    return eval('('+response+')' );
  }

  const { theme, themeArray } = await main();
  
  const Game = require('../public/js/Game');
  const game = new Game(themeArray);

  const room = new Room({name, theme, numWords, owner: req.user.username, game})
  await room.save()
  req.flash('success', 'New room created!');
  res.redirect(`/play/${room._id}`);
}

module.exports.showRoom = async(req, res, next) => {
  const room = await Room.findById(req.params.id)
  res.render('play', {room}) 
}

module.exports.deleteRoom = async(req, res, next) => {
  const {id} = req.params;
  await Room.findByIdAndDelete(id);
  req.flash('success', 'Successfully deleted room') //flash pop-up
  res.redirect('/rooms');
}