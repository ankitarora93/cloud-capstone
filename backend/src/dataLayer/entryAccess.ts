import * as AWS  from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import * as AWSXRay from 'aws-xray-sdk';

import { EntryItem } from '../models/EntryItem';
import { EntryUpdate } from '../models/EntryUpdate';
import { GetEntryRequest } from '../requests/GetEntryRequest';

const XAWS = AWSXRay.captureAWS(AWS);

export class EntryAccess {
    constructor(
        private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
        private readonly s3 = new XAWS.S3({signatureVersion: 'v4'}),
        private readonly entryTable = process.env.ENTRY_TABLE,
        private readonly entryIndex = process.env.ENTRY_INDEX_NAME,
        private readonly bucketName = process.env.IMAGES_S3_BUCKET,
        private readonly urlExpiration = process.env.SIGNED_URL_EXPIRATION) {
      }

      async getEntries(getEntryRequest: GetEntryRequest): Promise<EntryItem[]> {

        const result = await this.docClient.query({
            TableName: this.entryTable,
            IndexName: this.entryIndex,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
              ':userId': getEntryRequest.userId
            }
          }).promise();
        
          const items = result.Items
          return items as EntryItem[]
      }

      async createEntry(entryItem: EntryItem): Promise<EntryItem> {
        await this.docClient.put({
            TableName: this.entryTable,
            Item: entryItem
          }).promise()

          return entryItem
      }

      async updateImageUrl(userId: string, entryId: string, imageId: string): Promise<void> {

        await this.docClient.update({
            TableName: this.entryTable,
            Key: {
              "userId": userId,
              "entryId": entryId
            },
            UpdateExpression: "set attachmentUrl = :a",
            ExpressionAttributeValues: {
              ":a": `https://${this.bucketName}.s3.amazonaws.com/${imageId}`
            }
          }).promise()
      }

      async entryIdExists(entryId: string, userId: string): Promise<boolean> {
        const result = await this.docClient
          .get({
            TableName: this.entryTable,
            Key: {
              entryId: entryId,
              userId: userId
            }
          })
          .promise()
      
        console.log('Get entry: ', result)
        return !!result.Item
      }

      getUploadUrl(imageId: string) {
        return this.s3.getSignedUrl('putObject', {
          Bucket: this.bucketName,
          Key: imageId,
          Expires: parseInt(this.urlExpiration)
        })
     }

     async updateEntry(entryItem: EntryUpdate): Promise<void> {
        await this.docClient.update({
            TableName: this.entryTable,
            Key: {
              "userId": entryItem.userId,
              "entryId": entryItem.entryId
            },
            UpdateExpression: "set done = :d",
            ExpressionAttributeValues: {
              ":d": entryItem.done
            }
          }).promise()
     }

     async deleteEntry(entryId: string, userId: string): Promise<void> {
        await this.docClient.delete({
            TableName: this.entryTable,
            Key: {
              "userId": userId,
              "entryId": entryId
            }
          }).promise()
     }
}


