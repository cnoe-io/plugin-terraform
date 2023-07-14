
export interface Config {
  /** Optional configurations for the Terraform plugin */
  terraform: {
    /**
     * The S3 bucket where Terraform states are stored.
     * @visibility frontend
     */
    bucket: string;
    /**
     * The S3 prefix where Terraform states are stored.
     * @visibility frontend
     */
    prefix: string;
  };
}