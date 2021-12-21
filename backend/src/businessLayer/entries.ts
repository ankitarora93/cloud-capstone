import { EntryAccess } from "../dataLayer/entryAccess";
import { getUserId } from "../lambda/utils";
import { EntryItem } from "../models/EntryItem";
import * as uuid from 'uuid'
import { GetEntryRequest } from "../requests/GetEntryRequest";
import { EntryUpdate } from "../models/EntryUpdate";
import { createLogger } from '../utils/logger'

const entryAccess = new EntryAccess()
const logger = createLogger('entry')


export async function getEnteries(event): Promise<EntryItem[]> {
    logger.info('getEnteriesLog', event)

    const getEntryRequest: GetEntryRequest = {
        userId: getUserId(event)
    }

    return entryAccess.getEnteries(getEntryRequest)
} 

export async function createEntry(event): Promise<EntryItem> {
    logger.info('createEntryLog', event)

    const userId = getUserId(event)
    const entryId = uuid.v4();
    const createdAt = new Date().toISOString();
    const parsedBody = JSON.parse(event.body)
  
    const item: EntryItem = {
      userId: userId,
      entryId: entryId,
      createdAt: createdAt,
      entryText: parsedBody.entryText,
      done: false,
      attachmentUrl: ''
    }

    return entryAccess.createEntry(item)
}

export async function generateUploadUrl(event): Promise<string> {
    logger.info('generateUploadUrl', event)

    const entryId = event.pathParameters.entryId
    const userId = getUserId(event)
    const validEntryId = await entryAccess.entryIdExists(entryId, userId)
    
    if (!validEntryId) {
        throw new Error("Entry Id not valid")
    }
    
    const imageId = uuid.v4()
    await entryAccess.updateImageUrl(userId, entryId, imageId)

    const url = await entryAccess.getUploadUrl(imageId)
    return url
}

export async function updateEntry(event): Promise<void> {
    logger.info('updateEntryLog', event)

    const entryId = event.pathParameters.entryId
    const userId = getUserId(event)
    const validEntryId = await entryAccess.entryIdExists(entryId, userId)
    
    if (!validEntryId) {
        throw new Error("Entry Id not valid")
    }

    const parsedBody = JSON.parse(event.body)

    let entryItem: EntryUpdate = {
        entryId: entryId,
        userId: userId,
        done: parsedBody.done
    }

    await entryAccess.updateEntry(entryItem)
}

export async function deleteEntry(event): Promise<void> {
    logger.info('deleteEntry', event)

    const entryId = event.pathParameters.entryId
    const userId = getUserId(event)
    const validEntryId = await entryAccess.entryIdExists(entryId, userId)
    
    if (!validEntryId) {
        throw new Error("Entry Id not valid")
    }
    
    await entryAccess.deleteEntry(entryId, userId)
}
