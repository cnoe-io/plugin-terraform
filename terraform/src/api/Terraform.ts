import { KubernetesApi } from "@backstage/plugin-kubernetes";
import { TerraformApi } from "./index";

const API_VERSION = "v1";
const K8s_API_TIMEOUT = "timeoutSeconds";

export class Terraform implements TerraformApi {
  private kubernetesApi: KubernetesApi;

  constructor(
    kubernetesApi: KubernetesApi,
  ) {
    this.kubernetesApi = kubernetesApi;
  }

  async getSecret(
    clusterName: string | undefined,
    namespace: string,
    secretName: string
  ): Promise<any> {
    const ns = namespace !== undefined ? namespace : "default";
    const path = `/api/${API_VERSION}/namespaces/${ns}/secrets/${secretName}`;
    const query = new URLSearchParams({
      [K8s_API_TIMEOUT]: "30",
    });
    // need limits and pagination
    const resp = await this.kubernetesApi.proxy({
      clusterName:
        clusterName !== undefined ? clusterName : await this.getFirstCluster(),
      path: `${path}?${query.toString()}`,
    });

    if (!resp.ok) {
      return Promise.reject(
        `failed to fetch resources: ${resp.status}, ${
          resp.statusText
        }, ${await resp.text()}`
      );
    }
    // need validation
    const responseText = await resp.text()
    const secretJSON = JSON.parse(responseText)
    return [
      {
        "TFStateContents": secretJSON.data.tfstate
      }
    ]
  }

  async getFirstCluster(): Promise<string> {
    const clusters = await this.kubernetesApi.getClusters();
    if (clusters.length > 0) {
      return Promise.resolve(clusters[0].name);
    }
    return Promise.reject("no clusters found in configuration");
  }
}