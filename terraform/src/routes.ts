import { createRouteRef,createSubRouteRef } from '@backstage/core-plugin-api';

export const rootRouteRef = createRouteRef({
  id: 'terraformPlugin',
});

export const resourceDetailsRouteRef = createSubRouteRef({
  id: 'resourceDetails',
  parent: rootRouteRef,
  path: '/resourcedetails',
});