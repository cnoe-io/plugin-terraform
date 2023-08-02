import * as fs from 'fs';
import { errorHandler } from '@backstage/backend-common';
import express from 'express';
import Router from 'express-promise-router';
import { Logger } from 'winston';
import { Config } from '@backstage/config';
import { DefaultAwsCredentialsManager } from '@backstage/integration-aws-node';
import { S3Client, ListObjectsV2Command, GetObjectCommand  } from "@aws-sdk/client-s3";

type ListObjectsInput = {
  Bucket: string,
  Prefix: string,
  ContinuationToken?: string,
};

export interface RouterOptions {
  logger: Logger;
  config: Config;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger, config } = options;
  const awsCredentialsManager = DefaultAwsCredentialsManager.fromConfig(config);
  const credProvider = await awsCredentialsManager.getCredentialProvider({});
  const client = new S3Client({
    credentialDefaultProvider: () => credProvider.sdkCredentialProvider,
  });

  const router = Router();
  router.use(express.json());

  router.get('/health', (_, response) => {
    logger.info('PONG!');
    response.json({ status: 'ok' });
  });

  router.post('/getFileList', async (req, res) => {
    let responseObject:any = [];
    let token:string|undefined = "1";
    while(token) {
      let input:ListObjectsInput = {
        Bucket: req.body.Bucket,
        Prefix: req.body.Key,
      }
      if(token != "1" && token) {
        input.ContinuationToken = token;
      }
      const command = new ListObjectsV2Command(input);
      const commandResponse = await client.send(command);
      responseObject = responseObject.concat(commandResponse.Contents);
      logger.debug(JSON.stringify(commandResponse));
      token = commandResponse.NextContinuationToken;
    }
    res.json(responseObject);
  });

  router.post('/getLocalFileList', async (req, res) => {
    let responseObject:any[] = [];

    try {
      const fsstat = fs.lstatSync(req.body.FileLocation);
      if(fsstat.isDirectory()) {
        const filenames = fs.readdirSync(req.body.FileLocation);
        for(let i in filenames) {
          responseObject.push({
            Key: req.body.FileLocation+"/"+filenames[i]
          });
        }
      } else if(fsstat.isFile()) {
        responseObject.push({
          Key: req.body.FileLocation
        });
      }
    } catch(e) {
      logger.error(e)
    }

    res.json(responseObject);
  });

  router.post('/getTFStateFile', async (req, res) => {
    if(req.body.Bucket) {
      const command = new GetObjectCommand({
        Bucket: req.body.Bucket,
        Key: req.body.Key,
      });
      const commandResponse = await client.send(command);
      const str:any = await commandResponse.Body?.transformToString();
      res.json(JSON.parse(str));
    } else {
      let jsonData:any = {};
      try {
        const data = fs.readFileSync(req.body.Key, { encoding: 'utf8', flag: 'r' });
        jsonData = JSON.parse(data);
      } catch(e) {
        logger.error(e);
      }

      res.json(jsonData);
    }
  });

  router.use(errorHandler());
  return router;
}
