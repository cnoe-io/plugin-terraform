import { errorHandler } from '@backstage/backend-common';
import express from 'express';
import Router from 'express-promise-router';
import { Logger } from 'winston';
import { S3Client, ListObjectsV2Command, GetObjectCommand  } from "@aws-sdk/client-s3";

type ListObjectsInput = {
  Bucket: string,
  Prefix: string,
  ContinuationToken?: string,
};

export interface RouterOptions {
  logger: Logger;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger } = options;
  const client = new S3Client({});

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
      logger.info(JSON.stringify(commandResponse));
      token = commandResponse.NextContinuationToken;
    }
    res.json(responseObject);
  });

  router.post('/getTFStateFile', async (req, res) => {
    const command = new GetObjectCommand({
      Bucket: req.body.Bucket,
      Key: req.body.Key,
    });
    const commandResponse = await client.send(command);
    const str:any = await commandResponse.Body?.transformToString();
    res.json(JSON.parse(str));
  });

  router.use(errorHandler());
  return router;
}
