import {
  createOperatorOptions,
  createOperatorLabelMap
} from '../src/utils/rulesHelpers.js';

export const mockEvents = [
  {
    type: 'operation.received',
    name: 'Operation received',
    description: 'Fires whenever Inspectr ingests a new operation payload.'
  },
  {
    type: 'operation.updated',
    name: 'Operation updated',
    description: 'Triggered after additional metadata is attached to an operation.'
  },
  {
    type: 'operation.closed',
    name: 'Operation closed',
    description: 'Runs after the operation is archived or marked as resolved.'
  }
];

export const mockActionsCatalog = [
  {
    type: 'tag',
    label: 'Apply tags',
    description: 'Attach static tags to the matching operation.',
    params: [
      {
        name: 'tags',
        label: 'Tags to add',
        type: 'array<string>',
        placeholder: 'e.g. high_value, needs_review',
        help: 'Separate multiple tags with commas.',
        required: true
      }
    ]
  },
  {
    type: 'notification',
    label: 'Send workspace notification',
    description: 'Push a message to the review team for manual follow-up.',
    params: [
      {
        name: 'channel',
        label: 'Channel',
        type: 'string',
        placeholder: '#fraud-desk',
        required: true
      },
      {
        name: 'message',
        label: 'Message template',
        type: 'string',
        placeholder: 'High value operation {{operation.id}} requires review.',
        default: 'High value operation {{operation.id}} requires review.'
      }
    ]
  },
  {
    type: 'webhook.notify',
    label: 'Send webhook',
    description: 'Post a JSON payload to an external URL for downstream automation.',
    params: [
      {
        name: 'url',
        label: 'Webhook URL',
        type: 'string',
        placeholder: 'https://hooks.example.com/rules',
        required: true
      },
      {
        name: 'method',
        label: 'HTTP method',
        input: 'single_select',
        choices: [
          { value: 'POST', label: 'POST' },
          { value: 'PUT', label: 'PUT' },
          { value: 'PATCH', label: 'PATCH' }
        ],
        default: 'POST'
      },
      {
        name: 'headers',
        label: 'Headers',
        type: 'object',
        input: 'object',
        placeholder: '{ "Authorization": "Bearer ..." }'
      }
    ]
  }
];

export const mockOperatorCatalog = [
  {
    operator: '==',
    label: 'Equals',
    description: 'The left value must exactly match the right value.',
    value_required: true
  },
  {
    operator: '>=',
    label: 'Greater than or equal',
    description: 'The left value must be greater than or equal to the right number.',
    value_required: true
  },
  {
    operator: 'contains',
    label: 'Contains',
    description: 'Checks whether the left string contains the right string.',
    value_required: true
  },
  {
    operator: 'exists',
    label: 'Exists',
    description: 'Evaluates to true if the path resolves to any value.',
    value_required: false
  }
];

export const mockOperatorOptions = createOperatorOptions(mockOperatorCatalog);
export const mockOperatorLabelMap = createOperatorLabelMap(mockOperatorCatalog);

export const mockRules = [
  {
    id: 'rule-high-value-card',
    name: 'Escalate high-value card payments',
    description: 'Tag and notify the team when a card payment exceeds $1,000.',
    event: 'operation.received',
    priority: 5,
    active: true,
    expression: {
      op: 'and',
      args: [
        {
          op: '==',
          left: { path: 'operation.type' },
          right: 'card_payment'
        },
        {
          op: '>=',
          left: { path: 'operation.amount' },
          right: 1000
        }
      ]
    },
    actions: [
      {
        type: 'tag',
        params: {
          tags: ['high_value', 'manual_review']
        }
      },
      {
        type: 'notification',
        params: {
          channel: '#fraud-desk',
          message: 'Card payment {{operation.id}} is above the review threshold.'
        }
      }
    ],
    created_at: '2024-04-18T14:02:00Z',
    updated_at: '2024-08-02T09:45:00Z'
  },
  {
    id: 'rule-suspicious-location',
    name: 'Flag risky geographies',
    description: 'Pause the rule by default and notify when the country is on the watch list.',
    event: 'operation.received',
    priority: 8,
    active: false,
    expression: {
      op: 'or',
      args: [
        {
          op: 'contains',
          left: { path: 'operation.metadata.ip_country' },
          right: 'RU'
        },
        {
          op: 'contains',
          left: { path: 'operation.metadata.ip_country' },
          right: 'CN'
        }
      ]
    },
    actions: [
      {
        type: 'webhook.notify',
        params: {
          url: 'https://hooks.example.com/risk-alerts',
          method: 'POST',
          headers: { 'X-Rules-Trigger': 'risky-geo' }
        }
      }
    ],
    created_at: '2024-06-11T17:25:00Z',
    updated_at: '2024-07-20T10:12:00Z'
  },
  {
    id: 'rule-close-low-risk',
    name: 'Auto-close low risk events',
    description: 'Automatically close operations that match trusted partners.',
    event: 'operation.updated',
    priority: 15,
    active: true,
    expression: {
      op: 'and',
      args: [
        {
          op: 'exists',
          left: { path: 'operation.metadata.partner_id' }
        },
        {
          op: 'contains',
          left: { path: 'operation.metadata.partner_tier' },
          right: 'preferred'
        }
      ]
    },
    actions: [
      {
        type: 'notification',
        params: {
          channel: '#ops-notifications',
          message: 'Operation {{operation.id}} marked complete for trusted partner.'
        }
      }
    ],
    created_at: '2024-05-04T08:00:00Z',
    updated_at: '2024-08-10T13:00:00Z'
  }
];

export const createMockBuilderForm = () => ({
  name: 'Escalate high-value card payments',
  description: 'Tag and notify the team when a card payment exceeds $1,000.',
  event: 'operation.received',
  priority: 5,
  active: true,
  expressionType: 'and',
  conditions: [
    {
      path: 'operation.type',
      operator: '==',
      value: 'card_payment',
      valueType: 'string'
    },
    {
      path: 'operation.amount',
      operator: '>=',
      value: '1000',
      valueType: 'number'
    }
  ],
  actions: [
    {
      id: 'builder-action-1',
      type: 'tag',
      params: {
        tags: 'high_value, manual_review'
      }
    },
    {
      id: 'builder-action-2',
      type: 'notification',
      params: {
        channel: '#fraud-desk',
        message: 'Card payment {{operation.id}} is above the review threshold.'
      }
    }
  ]
});

export const mockRuleTemplates = [
  {
    id: 'template-high-value',
    group_type: 'fraud',
    name: 'High value payments',
    description: 'Escalate payments that exceed the configured threshold.',
    priority: 10,
    event: 'operation.received',
    expression: {
      op: 'and',
      args: [
        { op: '>=', left: { path: 'operation.amount' }, right: 2000 }
      ]
    },
    actions: [
      {
        type: 'tag',
        params: {
          tags: ['manual_review']
        }
      }
    ]
  }
];

export const mockRuleTemplateGroups = [
  {
    id: 'fraud',
    label: 'Fraud detection',
    description: 'Templates that help identify risky traffic.'
  }
];

export const mockOperationTags = ['priority:high', 'segment:card', 'region:us-east'];
