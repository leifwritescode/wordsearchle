import { Devvit } from "@devvit/public-api"

Devvit.addTrigger({
  events: ['AppUpgrade', 'AppInstall'],
  async onEvent(_, context) {
    const { scheduler } = context

    // cancel all of the existing jobs
    const jobs = await scheduler.listJobs()
    const cancellations = jobs.map(async job => {
      await scheduler.cancelJob(job.id)
    })
    await Promise.all(cancellations)

    // and reschedule them
    // nb: schedule fires 5 minutes past midnight to ensure date is correct
    await scheduler.runJob({
      name: 'word-search-generator',
      cron: "5 0 * * *"
    })
  }
})
