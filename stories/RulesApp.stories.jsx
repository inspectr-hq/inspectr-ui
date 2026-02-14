import React from 'react';
import RulesApp from '../src/components/RulesApp.jsx';
import InspectrContext from '../src/context/InspectrContext.jsx';
import {
  mockActionsCatalog,
  mockEvents,
  mockOperatorCatalog,
  mockRules,
  mockRuleTemplateGroups,
  mockRuleTemplates,
  mockOperationTags
} from './rulesMocks.js';

const action = () => () => {};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const deepClone = (value) => JSON.parse(JSON.stringify(value));

const makeMockClient = (initialRules, options = {}) => {
  let rulesState = deepClone(initialRules ?? []);
  let tagsState = deepClone(options.tags ?? mockOperationTags);

  const list = async () => {
    await delay(80);
    return { rules: deepClone(rulesState) };
  };

  const getEvents = async () => {
    await delay(50);
    return deepClone(mockEvents);
  };

  const getActions = async () => {
    await delay(60);
    return deepClone(mockActionsCatalog);
  };

  const getOperators = async () => {
    await delay(40);
    return deepClone(mockOperatorCatalog);
  };

  const create = async (payload) => {
    await delay(100);
    const now = new Date().toISOString();
    const created = { ...deepClone(payload), id: `rule-${Math.random().toString(36).slice(2, 10)}`, created_at: now, updated_at: now };
    rulesState = [created, ...rulesState];
    return deepClone(created);
  };

  const replace = async (id, payload) => {
    await delay(100);
    const existing = rulesState.find((rule) => rule.id === id);
    const now = new Date().toISOString();
    const next = {
      ...deepClone(payload),
      id,
      created_at: existing?.created_at ?? now,
      updated_at: now
    };
    rulesState = rulesState.map((rule) => (rule.id === id ? next : rule));
    return deepClone(next);
  };

  const update = async (id, payload) => {
    await delay(75);
    const existing = rulesState.find((rule) => rule.id === id);
    const now = new Date().toISOString();
    const next = {
      ...existing,
      ...deepClone(payload),
      id,
      created_at: existing?.created_at ?? payload?.created_at ?? now,
      updated_at: now
    };
    rulesState = rulesState.map((rule) => (rule.id === id ? next : rule));
    return deepClone(next);
  };

  const remove = async (id) => {
    await delay(60);
    rulesState = rulesState.filter((rule) => rule.id !== id);
    return { status: 'ok' };
  };

  const applyToHistory = async () => {
    await delay(120);
    return {
      matched_operations: 42,
      updated_operations: 19,
      duration_ms: 2800
    };
  };

  const rules = {
    list,
    getEvents,
    getActions,
    getOperators,
    create,
    replace,
    update,
    delete: remove,
    applyToHistory
  };

  const operations = {
    listTags: async () => {
      await delay(50);
      return { tags: deepClone(tagsState) };
    },
    bulkDeleteTag: async ({ tag }) => {
      await delay(90);
      tagsState = tagsState.filter((item) => item !== tag);
      return { removed_tag: tag };
    }
  };

  return { rules, operations };
};

const RulesAppStory = ({ initialRules, initialTags }) => {
  const client = React.useMemo(
    () => makeMockClient(initialRules ?? mockRules, { tags: initialTags ?? mockOperationTags }),
    [initialRules, initialTags]
  );

  const toastLogger = React.useMemo(() => action('toast'), []);

  React.useEffect(() => {
    const originalFetch = typeof globalThis.fetch === 'function' ? globalThis.fetch : null;
    const mockFetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input?.url ?? '';
      if (url.includes('/api/rules/templates/group-types')) {
        return {
          ok: true,
          status: 200,
          json: async () => deepClone(mockRuleTemplateGroups)
        };
      }
      if (url.includes('/api/rules/templates')) {
        return {
          ok: true,
          status: 200,
          json: async () => deepClone(mockRuleTemplates)
        };
      }
      if (originalFetch) {
        return originalFetch(input, init);
      }
      return {
        ok: false,
        status: 404,
        json: async () => ({})
      };
    };
    globalThis.fetch = mockFetch;
    return () => {
      globalThis.fetch = originalFetch;
    };
  }, []);

  const providerValue = React.useMemo(
    () => ({ client, setToast: toastLogger, toast: null }),
    [client, toastLogger]
  );

  return (
    <InspectrContext.Provider value={providerValue}>
      <div className="min-h-screen bg-slate-950 p-6">
        <RulesApp />
      </div>
    </InspectrContext.Provider>
  );
};

const Template = (args) => <RulesAppStory {...args} />;

export default {
  title: 'Components/RulesApp',
  component: RulesApp
};

export const PopulatedWorkspace = Template.bind({});
PopulatedWorkspace.args = {
  initialRules: mockRules,
  initialTags: mockOperationTags
};

export const EmptyWorkspace = Template.bind({});
EmptyWorkspace.args = {
  initialRules: [],
  initialTags: ['segment:card']
};
