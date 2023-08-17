import {createPlugin, createRoutableExtension} from '@backstage/core-plugin-api';

import {rootRouteRef} from './routes';

import {Entity} from '@backstage/catalog-model';

export const isTerraformAvailable = (entity: Entity) =>
  Boolean(entity.metadata.annotations?.['terraform/s3-bucket']) &&
  (
    Boolean(entity.metadata.annotations?.['terraform/s3-prefix']) ||
    Boolean(entity.metadata.annotations?.['terraform/local-filepath'])
  );

export const terraformPlugin = createPlugin({
  id: 'terraformPlugin',
  routes: {
    root: rootRouteRef,
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
