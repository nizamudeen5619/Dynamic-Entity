'use strict';

/**
 * demo-node/src/seed.js — Seeds 20 realistic client records into MongoDB.
 * Real names and data — no lorem ipsum (build plan requirement).
 * Demonstrates: maskedRoles, hooks, migrations.
 */

const mongoose = require('mongoose');
const { MongoAdapter } = require('dynamic-entity-server');

const CLIENT_ENTITY = 'clients';

const clientConfig = {
  entity: CLIENT_ENTITY,
  version: 2,
  fields: [
    {
      id: 'firstName',
      type: 'text',
      label: { en: 'First Name', de: 'Vorname' },
      validators: ['required'],
      tableColumn: true,
      visible: true,
    },
    {
      id: 'lastName',
      type: 'text',
      label: { en: 'Last Name', de: 'Nachname' },
      validators: ['required'],
      tableColumn: true,
      visible: true,
    },
    {
      id: 'email',
      type: 'text',
      label: { en: 'Email', de: 'E-Mail' },
      validators: ['required', 'email'],
      tableColumn: true,
      visible: true,
    },
    {
      id: 'phone',
      type: 'text',
      label: { en: 'Phone', de: 'Telefon' },
      tableColumn: false,
      visible: true,
    },
    {
      id: 'status',
      type: 'dropdown',
      label: { en: 'Status', de: 'Status' },
      options: [
        { value: 'active', label: { en: 'Active', de: 'Aktiv' } },
        { value: 'inactive', label: { en: 'Inactive', de: 'Inaktiv' } },
        { value: 'prospect', label: { en: 'Prospect', de: 'Interessent' } },
      ],
      tableColumn: true,
      visible: true,
      listName: 'CLIENTS - STATUS',
    },
    {
      id: 'salary',
      type: 'number',
      label: { en: 'Annual Salary', de: 'Jahresgehalt' },
      tableColumn: true,
      visible: true,
      maskData: true, // ADR-004: masked for IT_SUPPORT role
    },
    {
      id: 'notes',
      type: 'textarea',
      label: { en: 'Notes', de: 'Notizen' },
      visible: true,
      tableColumn: false,
    },
    {
      id: 'joinedAt',
      type: 'date',
      label: { en: 'Joined Date', de: 'Eintrittsdatum' },
      tableColumn: true,
      visible: true,
    },
  ],
  tabs: [],
  maskData: false,
  permissions: {
    view: [],    // All roles can view
    edit: ['admin', 'manager'],
    delete: ['admin'],
  },
};

const clientRecords = [
  { firstName: 'Emma', lastName: 'Hartmann', email: 'emma.hartmann@example.de', phone: '+49 30 123456', status: 'active', salary: 72000, notes: 'Key account manager contact.', joinedAt: '2023-03-15' },
  { firstName: 'Luca', lastName: 'Bianchi', email: 'luca.bianchi@example.it', phone: '+39 02 654321', status: 'active', salary: 85000, notes: 'Long-term partnership.', joinedAt: '2022-11-01' },
  { firstName: 'Sofia', lastName: 'Müller', email: 'sofia.mueller@example.de', phone: '+49 89 789012', status: 'prospect', salary: 0, notes: 'Initial meeting scheduled.', joinedAt: '2024-01-20' },
  { firstName: 'James', lastName: 'Thornton', email: 'james.thornton@example.co.uk', phone: '+44 20 112233', status: 'active', salary: 95000, notes: 'Renewed contract Q1 2024.', joinedAt: '2021-06-10' },
  { firstName: 'Isabelle', lastName: 'Dupont', email: 'isabelle.dupont@example.fr', phone: '+33 1 445566', status: 'inactive', salary: 67000, notes: 'Contract ended, possible return.', joinedAt: '2020-09-05' },
  { firstName: 'Noah', lastName: 'Fischer', email: 'noah.fischer@example.at', phone: '+43 1 223344', status: 'active', salary: 78000, notes: '', joinedAt: '2023-07-22' },
  { firstName: 'Mia', lastName: 'Johansson', email: 'mia.johansson@example.se', phone: '+46 8 334455', status: 'active', salary: 82000, notes: 'Prefers email communication.', joinedAt: '2022-04-18' },
  { firstName: 'Oliver', lastName: 'Hansen', email: 'oliver.hansen@example.dk', phone: '+45 33 556677', status: 'prospect', salary: 0, notes: 'Demo call next week.', joinedAt: '2024-02-12' },
  { firstName: 'Valentina', lastName: 'Rossi', email: 'valentina.rossi@example.it', phone: '+39 06 778899', status: 'active', salary: 91000, notes: 'VIP client — priority support.', joinedAt: '2021-01-30' },
  { firstName: 'Elias', lastName: 'Andersen', email: 'elias.andersen@example.no', phone: '+47 22 990011', status: 'active', salary: 88000, notes: 'Expanded service package in 2023.', joinedAt: '2020-12-14' },
  { firstName: 'Charlotte', lastName: 'Weber', email: 'charlotte.weber@example.de', phone: '+49 40 112244', status: 'inactive', salary: 55000, notes: 'On hold pending budget approval.', joinedAt: '2023-05-03' },
  { firstName: 'Matteo', lastName: 'Ferrari', email: 'matteo.ferrari@example.it', phone: '+39 011 334455', status: 'active', salary: 76000, notes: '', joinedAt: '2022-08-09' },
  { firstName: 'Anna', lastName: 'Svensson', email: 'anna.svensson@example.se', phone: '+46 31 556677', status: 'active', salary: 69000, notes: 'Attending annual summit.', joinedAt: '2023-11-25' },
  { firstName: 'Lucas', lastName: 'Schmidt', email: 'lucas.schmidt@example.ch', phone: '+41 44 778899', status: 'prospect', salary: 0, notes: 'Referred by Emma Hartmann.', joinedAt: '2024-03-07' },
  { firstName: 'Nina', lastName: 'Larsson', email: 'nina.larsson@example.se', phone: '+46 8 990011', status: 'active', salary: 83000, notes: 'Bilingual EN/SE.', joinedAt: '2021-09-18' },
  { firstName: 'Finn', lastName: 'O\'Brien', email: 'finn.obrien@example.ie', phone: '+353 1 223344', status: 'active', salary: 79000, notes: '', joinedAt: '2022-02-28' },
  { firstName: 'Amélie', lastName: 'Bernard', email: 'amelie.bernard@example.fr', phone: '+33 4 556677', status: 'inactive', salary: 61000, notes: 'Moved to competitor product.', joinedAt: '2020-07-11' },
  { firstName: 'Henrik', lastName: 'Nielsen', email: 'henrik.nielsen@example.dk', phone: '+45 32 778899', status: 'active', salary: 94000, notes: 'Enterprise plan.', joinedAt: '2021-04-22' },
  { firstName: 'Laura', lastName: 'González', email: 'laura.gonzalez@example.es', phone: '+34 91 990011', status: 'prospect', salary: 0, notes: 'Interested in premium tier.', joinedAt: '2024-01-05' },
  { firstName: 'Max', lastName: 'Braun', email: 'max.braun@example.de', phone: '+49 711 112233', status: 'active', salary: 87000, notes: 'Strategic partner.', joinedAt: '2020-03-30' },
];

/**
 * @param {import('dynamic-entity-server').MongoAdapter} adapter
 */
const seed = async adapter => {
  // eslint-disable-next-line no-console
  console.log('[seed] Checking for existing config...');

  const existing = await adapter.findConfig(CLIENT_ENTITY);
  if (!existing) {
    await adapter.saveConfig(clientConfig);
    // eslint-disable-next-line no-console
    console.log('[seed] Created clients config v2');
  } else {
    // eslint-disable-next-line no-console
    console.log('[seed] Config already exists (v' + existing.version + '), skipping config seed');
  }

  const existingRecords = await adapter.findRecords(CLIENT_ENTITY, { pageSize: 1 });
  if (existingRecords.pagination.total > 0) {
    // eslint-disable-next-line no-console
    console.log('[seed] Records already exist (' + existingRecords.pagination.total + '), skipping record seed');
    return;
  }

  const config = await adapter.findConfig(CLIENT_ENTITY);
  for (const record of clientRecords) {
    await adapter.saveRecord(CLIENT_ENTITY, {
      ...record,
      _configVersion: config.version,
      _needsMigration: false,
      _deletedAt: null,
    });
  }
  // eslint-disable-next-line no-console
  console.log('[seed] Seeded ' + clientRecords.length + ' client records');
};

module.exports = { seed };
