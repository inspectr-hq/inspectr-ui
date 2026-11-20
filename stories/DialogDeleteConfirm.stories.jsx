import React from 'react';
import DialogDeleteConfirm from '../src/components/DialogDeleteConfirm.jsx';

const rule = { name: 'Escalate high-value card payments' };

export default {
  title: 'Components/Dialogs/DialogDeleteConfirm',
  component: DialogDeleteConfirm,
  parameters: { layout: 'fullscreen' }
};

export const ConfirmDelete = () => (
  <DialogDeleteConfirm open rule={rule} onCancel={() => {}} onConfirm={() => {}} />
);

export const DeleteError = () => (
  <DialogDeleteConfirm
    open
    rule={rule}
    error="The rule could not be deleted. Try again."
    onCancel={() => {}}
    onConfirm={() => {}}
  />
);

export const Deleting = () => (
  <DialogDeleteConfirm open rule={rule} isDeleting onCancel={() => {}} onConfirm={() => {}} />
);
