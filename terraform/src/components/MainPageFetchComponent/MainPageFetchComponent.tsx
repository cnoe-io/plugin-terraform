import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableColumn, Progress, ResponseErrorPanel, Link, StructuredMetadataTable, InfoCard } from '@backstage/core-components';
import { useApi, configApiRef } from '@backstage/core-plugin-api';
import { Grid } from '@material-ui/core';

import useAsync from 'react-use/lib/useAsync';
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

export const ResourceTable = ({ resources }:any) => {
  const navigate = useNavigate();
  let resourcesObj:any = {};
  let nameIndex:any = {};

  let data:any[] = resources.filter((resource:any)=> {
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
    let newDependenciesObj:string[] = [];
    if(resourcesObj[i].instances[0].dependencies) {
      for(let j in resourcesObj[i].instances[0].dependencies) {
        if(nameIndex[resourcesObj[i].instances[0].dependencies[j]]) {
          newDependenciesObj.push(nameIndex[resourcesObj[i].instances[0].dependencies[j]]);
        }
      }
      resourcesObj[i].instances[0].dependencies = newDependenciesObj;
    }
  }

  const columns: TableColumn[] = [
    { title: 'Name', 
      render: (row: any) => {
        let resourceDetails = {
          name: row.name,
          displayName: row.displayName,
          details: resourcesObj[row.name]
        };
        return (
          <>
            <Link
              to="/terraform/resourcedetails"
              onClick={(e) => {
                e.preventDefault();
                navigate("/terraform/resourcedetails", { state: resourceDetails });
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
        data={data ? data : []}
      />
    </>
  );
};

export const TerraformTables = ({ returnObj }: any) => {
  return (
    <>
      <Grid container spacing={3} direction="column">
        <Grid item>
          <OutputTable outputs={returnObj.outputs || []}/>
        </Grid>
        <Grid item>
          <ResourceTable resources={returnObj.resources || []}/>
        </Grid>
      </Grid>
    </>
  );
};

export const MainPageFetchComponent = () => {
  const config = useApi(configApiRef);
  
  const { value, loading, error } = useAsync(async (): Promise<any> => {
    
    console.log(config);
    const backendUrl = config.getString('backend.baseUrl');
    
    let Bucket = config.getConfig('terraform').getString('bucket');
    let Prefix = config.getConfig('terraform').getString('prefix');

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
      throw await ResponseError.fromResponse(response);
    }
    let responseJSON = await response.json();
    let resourcesArr:any[] = [];
    let outputsArr:any[] = [];

    for(let i in responseJSON) {
      let file = responseJSON[i];
      if(!file.Key.endsWith("/")) {
        const response = await fetch(backendUrl+'/api/terraform/getTFStateFile', {
          method: 'post',
          body: JSON.stringify({
            Bucket,
            Key: file.Key
          }),
          headers: {'Content-Type': 'application/json'}
        });
        let tfStateJSON = await response.json();
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

    console.log(outputsArr);
    console.log(resourcesArr);

    return {
      "outputs": outputsArr,
      "resources": resourcesArr,
    };
  }, []);

  if (loading) {
    return <Progress />;
  } else if (error) {
    return <ResponseErrorPanel error={error} />;
  }

  return <TerraformTables returnObj={value || {}} />;
};
