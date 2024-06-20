import { createApiRef } from "@backstage/core-plugin-api";

export { Terraform } from "./Terraform";

export const TerraformApiRef = createApiRef<TerraformApi>({
  id: "plugin.terraform",
});
export interface TerraformApi {
  getSecret(
    clusterName: string | undefined,
    namespace: string | undefined,
    secretName: string,
  ): Promise<string>;
}
