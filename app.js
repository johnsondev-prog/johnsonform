(function () {
  const STORAGE_KEYS = {
    schema: 'jf_schema_v1',
    responses: 'jf_responses_v1'
  };

  const state = {
    schema: [],
    responses: {}
  };

  const els = {
    fieldType: document.getElementById('fieldType'),
    fieldLabel: document.getElementById('fieldLabel'),
    fieldKey: document.getElementById('fieldKey'),
    fieldPlaceholder: document.getElementById('fieldPlaceholder'),
    fieldRequired: document.getElementById('fieldRequired'),
    fieldOptionsWrap: document.getElementById('fieldOptionsWrap'),
    fieldOptions: document.getElementById('fieldOptions'),
    newFieldForm: document.getElementById('newFieldForm'),
    fieldList: document.getElementById('fieldList'),
    emptyBuilderState: document.getElementById('emptyBuilderState'),
    previewForm: document.getElementById('previewForm'),
    submitMessage: document.getElementById('submitMessage'),
    progressLabel: document.getElementById('progressLabel'),
    progressBar: document.getElementById('progressBar'),
    saveSchemaBtn: document.getElementById('saveSchemaBtn'),
    loadSchemaBtn: document.getElementById('loadSchemaBtn'),
    exportSchemaBtn: document.getElementById('exportSchemaBtn'),
    resetResponsesBtn: document.getElementById('resetResponsesBtn'),
    submitPreviewBtn: document.getElementById('submitPreviewBtn'),
    fieldItemTemplate: document.getElementById('fieldItemTemplate')
  };

  function uid() {
    return `f_${Math.random().toString(36).slice(2, 8)}_${Date.now().toString(36)}`;
  }

  function slugify(value) {
    return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  }

  function saveLocalState() {
    try {
      localStorage.setItem(STORAGE_KEYS.schema, JSON.stringify(state.schema));
      localStorage.setItem(STORAGE_KEYS.responses, JSON.stringify(state.responses));
    } catch (error) {
      console.warn('Could not save to localStorage', error);
    }
  }

  function loadLocalState() {
    try {
      const schema = JSON.parse(localStorage.getItem(STORAGE_KEYS.schema) || '[]');
      const responses = JSON.parse(localStorage.getItem(STORAGE_KEYS.responses) || '{}');
      if (Array.isArray(schema)) state.schema = schema;
      if (responses && typeof responses === 'object') state.responses = responses;
    } catch (error) {
      console.warn('Could not load local state', error);
    }
  }

  function updateProgress() {
    if (state.schema.length === 0) {
      els.progressLabel.textContent = 'Progress: 0%';
      els.progressBar.style.width = '0%';
      return;
    }

    const completed = state.schema.filter((field) => {
      const val = state.responses[field.key];
      if (field.type === 'checkbox') return val === true;
      return val !== undefined && val !== null && String(val).trim() !== '';
    }).length;

    const percent = Math.round((completed / state.schema.length) * 100);
    els.progressLabel.textContent = `Progress: ${percent}%`;
    els.progressBar.style.width = `${percent}%`;
  }

  function renderBuilderList() {
    els.fieldList.innerHTML = '';
    els.emptyBuilderState.classList.toggle('hidden', state.schema.length > 0);

    state.schema.forEach((field, index) => {
      const row = els.fieldItemTemplate.content.firstElementChild.cloneNode(true);
      row.querySelector('.field-meta').innerHTML = `<b>${field.label}</b><small>${field.type} • ${field.key}${field.required ? ' • required' : ''}</small>`;
      row.querySelectorAll('button[data-action]').forEach((button) => {
        button.addEventListener('click', () => handleFieldAction(button.dataset.action, index));
      });
      els.fieldList.appendChild(row);
    });
  }

  function createInputForField(field) {
    const wrapper = document.createElement('div');
    wrapper.className = 'preview-field';

    const label = document.createElement('label');
    label.textContent = field.label + (field.required ? ' *' : '');
    label.setAttribute('for', `input_${field.id}`);

    let control;
    if (field.type === 'textarea') {
      control = document.createElement('textarea');
    } else if (field.type === 'select') {
      control = document.createElement('select');
      const defaultOpt = document.createElement('option');
      defaultOpt.value = '';
      defaultOpt.textContent = '-- Select --';
      control.appendChild(defaultOpt);
      (field.options || []).forEach((option) => {
        const opt = document.createElement('option');
        opt.value = option;
        opt.textContent = option;
        control.appendChild(opt);
      });
    } else if (field.type === 'checkbox') {
      control = document.createElement('input');
      control.type = 'checkbox';
      control.checked = !!state.responses[field.key];
    } else {
      control = document.createElement('input');
      control.type = field.type;
    }

    control.id = `input_${field.id}`;
    control.name = field.key;
    if (field.placeholder && field.type !== 'checkbox' && field.type !== 'select') {
      control.placeholder = field.placeholder;
    }
    control.required = !!field.required;

    if (field.type !== 'checkbox' && state.responses[field.key] !== undefined) {
      control.value = state.responses[field.key];
    }

    control.addEventListener('input', () => {
      if (field.type === 'checkbox') {
        state.responses[field.key] = control.checked;
      } else {
        state.responses[field.key] = control.value;
      }
      saveLocalState();
      updateProgress();
    });

    wrapper.append(label, control);
    return wrapper;
  }

  function renderPreviewForm() {
    els.previewForm.innerHTML = '';
    els.submitMessage.textContent = '';

    if (state.schema.length === 0) {
      const p = document.createElement('p');
      p.className = 'empty-state';
      p.textContent = 'Preview will appear here once fields are added.';
      els.previewForm.appendChild(p);
      updateProgress();
      return;
    }

    state.schema.forEach((field) => {
      els.previewForm.appendChild(createInputForField(field));
    });

    updateProgress();
  }

  function handleFieldAction(action, index) {
    const item = state.schema[index];
    if (!item) return;

    if (action === 'delete') {
      state.schema.splice(index, 1);
      delete state.responses[item.key];
    }

    if (action === 'duplicate') {
      const clone = { ...item, id: uid(), key: `${item.key}_${state.schema.length + 1}` };
      state.schema.splice(index + 1, 0, clone);
    }

    if (action === 'up' && index > 0) {
      [state.schema[index - 1], state.schema[index]] = [state.schema[index], state.schema[index - 1]];
    }

    if (action === 'down' && index < state.schema.length - 1) {
      [state.schema[index + 1], state.schema[index]] = [state.schema[index], state.schema[index + 1]];
    }

    saveLocalState();
    renderBuilderList();
    renderPreviewForm();
  }

  function addField(event) {
    event.preventDefault();

    const type = els.fieldType.value;
    const label = els.fieldLabel.value.trim();
    const key = slugify(els.fieldKey.value || label);
    const placeholder = els.fieldPlaceholder.value.trim();
    const required = els.fieldRequired.checked;
    const options = type === 'select'
      ? els.fieldOptions.value.split(',').map((opt) => opt.trim()).filter(Boolean)
      : [];

    if (!label || !key) {
      alert('Please provide a label and key for the field.');
      return;
    }

    if (state.schema.some((field) => field.key === key)) {
      alert('Field keys must be unique.');
      return;
    }

    if (type === 'select' && options.length === 0) {
      alert('Select fields require at least one option.');
      return;
    }

    state.schema.push({ id: uid(), type, label, key, placeholder, required, options });

    els.newFieldForm.reset();
    els.fieldType.value = 'text';
    toggleOptionsVisibility();

    saveLocalState();
    renderBuilderList();
    renderPreviewForm();
  }

  function toggleOptionsVisibility() {
    const show = els.fieldType.value === 'select';
    els.fieldOptionsWrap.classList.toggle('hidden', !show);
    els.fieldOptions.required = show;
  }

  function saveSchema() {
    saveLocalState();
    els.submitMessage.textContent = 'Schema saved to this browser.';
  }

  function loadSchema() {
    loadLocalState();
    renderBuilderList();
    renderPreviewForm();
    els.submitMessage.textContent = 'Loaded schema from this browser.';
  }

  function exportSchema() {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      schema: state.schema
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'johnson-form-schema.json';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function resetResponses() {
    state.responses = {};
    saveLocalState();
    renderPreviewForm();
    els.submitMessage.textContent = 'Answers reset.';
  }

  function submitPreviewForm() {
    if (state.schema.length === 0) {
      els.submitMessage.textContent = 'Add fields before submitting.';
      return;
    }

    const missingRequired = state.schema.filter((field) => {
      if (!field.required) return false;
      const value = state.responses[field.key];
      if (field.type === 'checkbox') return value !== true;
      return !value;
    });

    if (missingRequired.length > 0) {
      els.submitMessage.textContent = `Please complete required fields: ${missingRequired.map((f) => f.label).join(', ')}`;
      return;
    }

    const payload = {
      submittedAt: new Date().toISOString(),
      values: { ...state.responses }
    };

    console.info('Preview submit payload', payload);
    els.submitMessage.textContent = 'Submitted locally. Check console for payload.';
  }

  function bootstrap() {
    loadLocalState();
    renderBuilderList();
    renderPreviewForm();
    toggleOptionsVisibility();

    els.fieldType.addEventListener('change', toggleOptionsVisibility);
    els.newFieldForm.addEventListener('submit', addField);
    els.saveSchemaBtn.addEventListener('click', saveSchema);
    els.loadSchemaBtn.addEventListener('click', loadSchema);
    els.exportSchemaBtn.addEventListener('click', exportSchema);
    els.resetResponsesBtn.addEventListener('click', resetResponses);
    els.submitPreviewBtn.addEventListener('click', submitPreviewForm);

    if (!window.localStorage) {
      console.warn('localStorage unavailable. Progress continues in-memory for this session only.');
    }
  }

  bootstrap();
})();
