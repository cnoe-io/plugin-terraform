import React from 'react';

import {
  Header,
  Page,
  Content,
} from '@backstage/core-components';
import { MainPageFetchComponent } from '../MainPageFetchComponent';

export const MainPageComponent = () => (
  <Page themeId="tool">
    <Header title="Terraform">
    </Header>
    <Content>
      <MainPageFetchComponent />
    </Content>
  </Page>
);
