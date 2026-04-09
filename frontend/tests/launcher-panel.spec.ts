import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import LauncherPanel from '../app/components/LauncherPanel.vue'

describe('LauncherPanel', () => {
  it('emits an edited preset payload when the form is submitted', async () => {
    const wrapper = await mountSuspended(LauncherPanel, {
      props: {
        pending: false,
        presets: [
          {
            id: 'refund-broken-mug',
            title: 'Refund a broken mug',
            description: 'Refund path',
            customerMessage: 'My mug arrived broken. Refund?',
            order: {
              order_id: 'A12345',
              status: 'Delivered',
              total: 19.99,
              customer_id: 'CUST123'
            }
          }
        ]
      }
    })

    await wrapper.find('#mode').setValue('mock')
    await wrapper.find('#customer-message').setValue('Please refund this damaged order immediately.')
    await wrapper.find('#order-id').setValue('A12345-UPDATED')
    await wrapper.find('form').trigger('submit.prevent')

    const emitted = wrapper.emitted('submit')

    expect(emitted).toBeTruthy()
    expect(emitted?.[0]?.[0]).toMatchObject({
      presetId: 'refund-broken-mug',
      mode: 'mock',
      customerMessage: 'Please refund this damaged order immediately.',
      order: {
        order_id: 'A12345-UPDATED',
        status: 'Delivered',
        total: 19.99,
        customer_id: 'CUST123'
      }
    })
  })
})
