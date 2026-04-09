import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import RunDetailTabs from '../app/components/RunDetailTabs.vue'

describe('RunDetailTabs', () => {
  it('switches from chat to timeline when the secondary tab is clicked', async () => {
    const wrapper = await mountSuspended(RunDetailTabs, {
      props: {
        activeTab: 'chat'
      }
    })

    const buttons = wrapper.findAll('button')
    await buttons[1].trigger('click')

    expect(wrapper.emitted('change')?.[0]?.[0]).toBe('timeline')
  })
})
