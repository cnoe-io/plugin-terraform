import React from 'react';
import { useLocation } from 'react-router-dom';
import { Grid } from '@material-ui/core';
import {
  InfoCard,
  Header,
  Page,
  Content,
  StructuredMetadataTable,
  DependencyGraph,
  DependencyGraphTypes,
} from '@backstage/core-components';

export const ResourceDetailComponent = () => {
  const {state} = useLocation();

  console.log(state);

  const graphStyle = { border: '1px solid grey' };
  let dependNodes = [
    {'id': state.displayName}
  ];

  let details:any = {};
  for(let i in state.details) {
    if(!Array.isArray(state.details[i])) {
      details[i] = state.details[i];
    } 
  }

  let dependEdges:any[] = [];
  for(let i in state.details?.instances[0]?.dependencies) {
    dependNodes.push({
      'id': state.details?.instances[0]?.dependencies[i]
    });
    dependEdges.push({
      'from': state.details?.instances[0]?.dependencies[i], 'to': state.displayName
    });
  }

  const attributes:any = {};
  for(let i in state.details?.instances[0]?.attributes) {
    let attribute:any = state.details?.instances[0]?.attributes[i];
    if(Array.isArray(attribute)) {
      attributes[i] = JSON.stringify(attribute);
    } else if (!attribute) {
      attributes[i] = "";
    } else {
      attributes[i] = attribute;
    }
  }

  return (
    <Page themeId="tool">
      <Header title={state.displayName}>
      </Header>
      <Content>
        <Grid container spacing={3}>
          <Grid item xs={5}>
            <InfoCard title="Details" typeLink="/">
              { <StructuredMetadataTable metadata={details} /> }
            </InfoCard>
            &nbsp;
            <InfoCard title="Attributes" typeLink="/">
              { <StructuredMetadataTable metadata={attributes} /> }
            </InfoCard>
          </Grid>
          <Grid item xs={5}>
            <InfoCard title="Dependencies">
              <DependencyGraph
                nodes={dependNodes}
                edges={dependEdges}
                direction={DependencyGraphTypes.Direction.RIGHT_LEFT}
                style={graphStyle}
                paddingX={50}
                paddingY={50}
              />
            </InfoCard>
          </Grid>
        </Grid>
      </Content>
    </Page>
  );
}
