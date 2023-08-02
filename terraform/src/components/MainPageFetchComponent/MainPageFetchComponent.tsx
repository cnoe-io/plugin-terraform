import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import {
  Table,
  TableColumn,
  Progress,
  ResponseErrorPanel,
  Link,
  StructuredMetadataTable,
  InfoCard,
  DependencyGraph,
  DependencyGraphTypes,
} from '@backstage/core-components';
import { useApi, configApiRef } from '@backstage/core-plugin-api';
import { useEntity } from '@backstage/plugin-catalog-react';
import { Grid } from '@material-ui/core';
import Drawer from '@material-ui/core/Drawer';

import fetch from 'node-fetch';
import { ResponseError } from '@backstage/errors';

export const OutputTable = ({ outputs }:any) => {
  let data:any = {};
  for(let i in outputs) {
    data[Number(i)+1] = outputs[i].value;
  }

  return (
    <>
      <InfoCard title="Outputs">
        <StructuredMetadataTable
          metadata={data}
        />
      </InfoCard>
    </>
  );
}

export const ResourceTable = ({ resources,setResourceDetail }:{resources:any, setResourceDetail:Dispatch<SetStateAction<any>>}) => {
  const columns: TableColumn[] = [
    { title: 'Name',
      render: (row: any) => {
        const resourceDetailsObj = {
          name: row.name,
          displayName: row.displayName,
        }
        return (
          <>
            <Link
              to="/terraform/resourcedetails"
              onClick={(e:any) => {
                e.preventDefault();
                setResourceDetail(resourceDetailsObj);
              }}
            >{row.displayName}</Link>
          </>
        );
      },
    },
    { title: 'Type', field: 'type' },
  ];

  return (
    <>
      <Table
        title="Resources"
        options={{ search: true, paging: true }}
        columns={columns}
        data={resources}
      />
    </>
  );
};

export const TerraformTables = ({ resources,outputs,setResourceDetail }: {resources: any[], outputs: any[], setResourceDetail:Dispatch<SetStateAction<any>>}) => {
  return (
    <>
      <Grid container spacing={3} direction="column">
        <Grid item>
          <OutputTable outputs={outputs}/>
        </Grid>
        <Grid item>
          <ResourceTable resources={resources} setResourceDetail={setResourceDetail}/>
        </Grid>
      </Grid>
    </>
  );
};

export const ResourceDetailComponent = ({resourceDetail,allResources,setResourceDetail}:{resourceDetail:any,allResources:any,setResourceDetail:Dispatch<SetStateAction<any>>}) => {
  const [details,setDetails] = useState<any>({});
  const [attributes,setAttributes] = useState<any>({});
  const [dependNodes,setDependNodes] = useState<any[]>([]);
  const [dependEdges,setDependEdges] = useState<any[]>([]);

  const graphStyle = { border: '1px solid grey' };

  useEffect(()=>{
    const resourceObj = allResources[resourceDetail.name];

    let newDetails:any = {};
    for(let i in resourceObj) {
      if(!Array.isArray(resourceObj[i])) {
        newDetails[i] = resourceObj[i];
      }
    }
    setDetails(newDetails);

    const newAttributes:any = {};
    for(let i in resourceObj?.instances[0]?.attributes) {
      let attribute:any = resourceObj?.instances[0]?.attributes[i];
      if(Array.isArray(attribute) || typeof attribute === "object") {
        newAttributes[i] = JSON.stringify(attribute);
      } else if (!attribute) {
        newAttributes[i] = "";
      } else {
        newAttributes[i] = attribute;
      }
    }
    setAttributes(newAttributes);

    let newDependNodes:any[] = [{'id': resourceDetail.displayName, 'name': resourceDetail.name}];
    let newDependEdges:any[] = [];
    for(let i in resourceObj?.instances[0]?.dependencies) {
      newDependNodes.push({
        'id': resourceObj.instances[0]?.dependencies[i].displayName, 'name': resourceObj.instances[0]?.dependencies[i].name
      });
      newDependEdges.push({
        'from': resourceObj.instances[0]?.dependencies[i].displayName, 'to': resourceDetail.displayName
      });
    }
    setDependNodes(newDependNodes);
    setDependEdges(newDependEdges);
  },[resourceDetail,allResources]);


  return (
    <div style={{maxWidth: '800px'}}>
      <InfoCard title="Details">
        { <StructuredMetadataTable metadata={details} /> }
      </InfoCard>
      &nbsp;
      <InfoCard title="Attributes">
        { <StructuredMetadataTable metadata={attributes} /> }
      </InfoCard>
      <InfoCard title="Dependencies">
        <DependencyGraph
          nodes={dependNodes}
          edges={dependEdges}
          direction={DependencyGraphTypes.Direction.RIGHT_LEFT}
          style={graphStyle}
          paddingX={50}
          paddingY={50}
          renderNode={props => {
              const height = 100;
              const width = (props.node.id?.length*12);
              const resourceDetailsObj = {
                name: props.node.name,
                displayName: props.node.id,
              };
              return (
                <g>
                  <rect width={width} height={height} rx={20} fill='#36baa2'/>
                  <text
                    y={height/2}
                    x={width/2}
                    alignmentBaseline="middle"
                    textAnchor="middle"
                  >
                    <Link
                      style={{fontSize: 20}}
                      to="/terraform/resourcedetails"
                      onClick={(e) => {
                        e.preventDefault();
                        setResourceDetail(resourceDetailsObj);
                      }}
                  >{props.node.id}</Link>
                  </text>
                </g>
              );
            }
          }
        />
      </InfoCard>
    </div>
  );
}

export const MainPageFetchComponent = () => {
  const config = useApi(configApiRef);
  const { entity } = useEntity();
  const backendUrl = config.getString('backend.baseUrl');

  const [resourceDetail,setResourceDetail] = useState<any>({});
  const [allResources,setAllResources] = useState<any>({});
  const [resources, setResources] = useState<any[]>([]);
  const [outputs, setOutputs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ResponseError>();

  function parseResources(resourcesArr:any[]) {
    let resourcesObj:any = {};
    let nameIndex:any = {};
    let data:any[] = resourcesArr.filter((resource:any)=> {
      if(resource.mode === "managed") {
        return true;
      } else {
        return false;
      }
    }).map((resource:any)=> {
      let resourceName:string = "";
      if(resource.module) {
        resourceName += resource.module.split("[")[0] + ".";
      } else {
        resourceName += resource.mode + "."
      }
      resourceName += resource.type + "." + resource.name;
      resourcesObj[resourceName] = resource;
      let displayName = resourceName;
      if(resource.instances[0].attributes.name) {
        displayName = resource.instances[0].attributes.name;
      } else if(resource.instances[0].attributes.id) {
        displayName = resource.instances[0].attributes.id;
      }
      nameIndex[resourceName] = displayName;
      return {
        name: resourceName,
        displayName: displayName,
        type: resource.type,
      }
    });

    for(let i in resourcesObj) {
      let newDependenciesObj:any[] = [];
      if(resourcesObj[i].instances[0].dependencies) {
        for(let j in resourcesObj[i].instances[0].dependencies) {
          if(nameIndex[resourcesObj[i].instances[0].dependencies[j]]) {
            newDependenciesObj.push({name: resourcesObj[i].instances[0].dependencies[j], displayName: nameIndex[resourcesObj[i].instances[0].dependencies[j]]});
          }
        }
        resourcesObj[i].instances[0].dependencies = newDependenciesObj;
      }
    }

    setResources(data);
    setAllResources(resourcesObj);
  }

  useEffect(() => {
    const getStateFiles = async() => {
      let resourcesArr:any[] = [];
      let outputsArr:any[] = [];
      let responseJSON:any = {};

      if(Bucket) {
        responseJSON = await s3GetFileList(Bucket,Prefix);
      } else if(FileLocation) {
        responseJSON = await localGetFileList(FileLocation);
      }

      for(let i in responseJSON) {
        let file = responseJSON[i];
        if(!file.Key.endsWith("/")) {
          const tfStateJSON:any = await getTFStateFile(Bucket,file);
          if(tfStateJSON.outputs) {
            for(let i in tfStateJSON.outputs) {
              outputsArr.push(tfStateJSON.outputs[i]);
            }
          }
          if(tfStateJSON.resources) {
            for(let i in tfStateJSON.resources) {
              resourcesArr.push(tfStateJSON.resources[i]);
            }
          }
        }
      }

      parseResources(resourcesArr);
      setOutputs(outputsArr);
      setLoading(false);
    };

    const s3GetFileList = async (Bucket:string,Prefix:string) => {
      const requestBody = {
        Bucket,
        Prefix
      };

      const response = await fetch(backendUrl+'/api/terraform/getFileList', {
        method: 'post',
        body: JSON.stringify(requestBody),
        headers: {'Content-Type': 'application/json'}
      });
      if (!response.ok) {
        setError(await ResponseError.fromResponse(response));
      }
      const responseJSON = await response.json();
      return responseJSON;
    };

    const localGetFileList = async (FileLocation:string) => {
      const requestBody = {
        FileLocation,
      };
      const response = await fetch(backendUrl+'/api/terraform/getLocalFileList', {
        method: 'post',
        body: JSON.stringify(requestBody),
        headers: {'Content-Type': 'application/json'}
      });
      if (!response.ok) {
        setError(await ResponseError.fromResponse(response));
      }
      const responseJSON = await response.json();
      return responseJSON;
    };

    const getTFStateFile = async (Bucket:string,file:any) => {
      let bodyObj:any = {
        Key: file.Key
      };
      if(Bucket) {
        bodyObj.Bucket = Bucket;
      }
      const response = await fetch(backendUrl+'/api/terraform/getTFStateFile', {
        method: 'post',
        body: JSON.stringify(bodyObj),
        headers: {'Content-Type': 'application/json'}
      });
      return await response.json();
    };

    let Bucket = "";
    let Prefix = "";
    let FileLocation = "";

    if(entity.metadata.annotations?.['terraform/s3-bucket']) {
      Bucket = entity.metadata.annotations?.['terraform/s3-bucket'] || "";
    }

    if(entity.metadata.annotations?.['terraform/s3-prefix']) {
      Prefix = entity.metadata.annotations?.['terraform/s3-bucket'] || "";
    }

    if(!Bucket) {
      FileLocation = entity.metadata.annotations?.['terraform/local-filepath'] || "";
    }

    getStateFiles();
  }, []);

  if (loading) {
    return <Progress />;
  } else if (error) {
    return <ResponseErrorPanel error={error} />;
  }

  return <>
    <TerraformTables resources={resources} outputs={outputs} setResourceDetail={setResourceDetail}/>
    <Drawer
      anchor="right"
      open={resourceDetail.name}
      onClose={() => setResourceDetail({})}
    >
      <ResourceDetailComponent resourceDetail={resourceDetail} allResources={allResources} setResourceDetail={setResourceDetail}/>
    </Drawer>
  </>;
};
