import { Devvit } from '@devvit/public-api';
import { wordlist } from '../../api/wordlist.js';
import { WordSearch } from '../../api/wordsearch.js';
import { CreatePreview } from '../../components/Preview.js';

Devvit.addSchedulerJob({
  name: 'word-search-generator',
  onRun: async (_, context) => {
    const { redis, reddit } = context

    console.log('Generating word search...')
    var wordsearch = new WordSearch({
      make: {
        dictionary: wordlist,
        minLength: 3,
        maxLength: 10,
        width: 10,
        height: 10
      }
    })

    const date = new Date(Date.now())
    const subreddit = await context.reddit.getCurrentSubreddit();

    console.log('Creating new submission...')
    var submission = await reddit.submitPost({
      preview: CreatePreview(),
      title: `Daily Wordsearch — ${date.toDateString()}`,
      subredditName: subreddit.name,
    })

    console.log('Saving word search...')
    await wordsearch.save(submission.id, redis)
  }
})
