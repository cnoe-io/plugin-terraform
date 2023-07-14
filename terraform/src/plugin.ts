import { createPlugin, createRoutableExtension } from '@backstage/core-plugin-api';

import { rootRouteRef, resourceDetailsRouteRef } from './routes';

export const terraformPlugin = createPlugin({
  id: 'terraformPlugin',
  routes: {
    root: rootRouteRef,
    resourceDetails: resourceDetailsRouteRef,
  },
});

export const TerraformPluginPage = terraformPlugin.provide(
  createRoutableExtension({
    name: 'TerraformPluginPage',
    component: () =>
      import('./components/RootComponent').then(m => m.RootComponent),
    mountPoint: rootRouteRef,
  }),
);
