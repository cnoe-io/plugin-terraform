import React from 'react';
import { screen } from '@testing-library/react';
import { ResourceDetailComponent } from './ResourceDetailComponent';
import {
  renderInTestApp,
} from "@backstage/test-utils";

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useLocation: () => ({
    state: {
      "name": "module.eks.aws_cloudwatch_log_group.this",
      "displayName": "/aws/eks/emr-eks-fargate/cluster",
      "details": {
        "module": "module.eks",
        "mode": "managed",
        "type": "aws_cloudwatch_log_group",
        "name": "this",
        "provider": "provider[\"registry.terraform.io/hashicorp/aws\"]",
        "instances": [
          {
            "index_key": 0,
            "schema_version": 0,
            "attributes": {
                "arn": "arn:aws:logs:us-west-2:833162080385:log-group:/aws/eks/emr-eks-fargate/cluster",
                "id": "/aws/eks/emr-eks-fargate/cluster",
                "kms_key_id": "",
                "name": "/aws/eks/emr-eks-fargate/cluster",
                "name_prefix": "",
                "retention_in_days": 90,
                "skip_destroy": false,
                "tags": {
                    "Blueprint": "emr-eks-fargate",
                    "GithubRepo": "github.com/awslabs/data-on-eks",
                    "Name": "/aws/eks/emr-eks-fargate/cluster"
                },
                "tags_all": {
                    "Blueprint": "emr-eks-fargate",
                    "GithubRepo": "github.com/awslabs/data-on-eks",
                    "Name": "/aws/eks/emr-eks-fargate/cluster"
                }
            },
            "sensitive_attributes": [],
            "private": "bnVsbA==",
            "create_before_destroy": true
          }
        ]
      }
    }
  })
}));

describe('ResourceDetailComponent', () => {
  it('renders the resource details', async () => {
    renderInTestApp(<ResourceDetailComponent />);
    // Wait for the table to render
    const table = await screen.findAllByRole('table');
    // Assert that the table contains the expected output data
    expect(table[0]).toBeInTheDocument();
    expect(screen.getAllByText('/aws/eks/emr-eks-fargate/cluster')[0]).toBeInTheDocument();
  });
});