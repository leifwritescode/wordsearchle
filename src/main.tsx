import { Devvit } from '@devvit/public-api';
import { App } from './components/App.js';
import './capabilities/scheduler/index.js'
import './capabilities/triggers/index.js'

// Define what packages you want to use
Devvit.configure({
  redditAPI: true,
  redis: true
});

Devvit.addCustomPostType({
  name: 'Hello Blocks',
  height: 'tall',
  render: App,
});

export default Devvit;
