import type { RunPreset } from '~/shared/run-types'

export const RUN_PRESETS: RunPreset[] = [
  {
    id: 'refund-broken-mug',
    title: 'Refund a broken mug',
    description: 'Delivered order, refund path, simple tool call chain.',
    customerMessage: 'My mug arrived broken. Refund?',
    order: {
      order_id: 'A12345',
      status: 'Delivered',
      total: 19.99,
      customer_id: 'CUST123'
    }
  },
  {
    id: 'cancel-processing-order',
    title: 'Cancel a processing order',
    description: 'Processing order, cancel path, no shipping edge cases.',
    customerMessage: "Please cancel my order, I don't need it anymore.",
    order: {
      order_id: 'B54321',
      status: 'Processing',
      total: 59.99,
      customer_id: 'CUST456'
    }
  }
]
