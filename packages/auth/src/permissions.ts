import { createAccessControl } from 'better-auth/plugins/access';
import {
  adminAc,
  defaultStatements,
  memberAc,
  ownerAc,
} from 'better-auth/plugins/organization/access';

const statement = {
  ...defaultStatements,

  website: [
    'create',
    'read',
    'update',
    'delete',
    'configure',
    'view_analytics',
    'manage_tracking',
    'transfer',
  ],

  subscription: ['read', 'update', 'cancel', 'manage_billing', 'view_usage'],

  invitation: ['create', 'cancel'],
} as const;

const ac = createAccessControl(statement);

const viewer = ac.newRole({
  website: ['read', 'view_analytics'],
  subscription: ['read'],
});

const member = ac.newRole({
  website: ['read', 'configure', 'view_analytics', 'manage_tracking'],
  subscription: ['read', 'view_usage'],
  ...memberAc.statements,
});

const admin = ac.newRole({
  website: [
    'create',
    'read',
    'update',
    'delete',
    'configure',
    'view_analytics',
    'manage_tracking',
    'transfer',
  ],
  subscription: ['read', 'view_usage'],
  ...adminAc.statements,
});

const owner = ac.newRole({
  website: [
    'create',
    'read',
    'update',
    'delete',
    'configure',
    'view_analytics',
    'manage_tracking',
    'transfer',
  ],
  subscription: ['read', 'update', 'cancel', 'manage_billing', 'view_usage'],
  ...ownerAc.statements,
});

export { ac, owner, admin, member, viewer };
