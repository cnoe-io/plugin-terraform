import {createPlugin, createRoutableExtension} from '@backstage/core-plugin-api';

import {rootRouteRef} from './routes';
import {
  TERRAFORM_S3_BUCKET,
  TERRAFORM_S3_PREFIX,
  TERRAFORM_LOCAL_PATH,
} from './consts';

import {Entity} from '@backstage/catalog-model';

export const isTerraformAvailable = (entity: Entity) =>
((Boolean(entity.metadata.annotations?.[TERRAFORM_S3_BUCKET]) &&
  Boolean(entity.metadata.annotations?.[TERRAFORM_S3_PREFIX])) ||
  Boolean(entity.metadata.annotations?.[TERRAFORM_LOCAL_PATH])
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
