import {
  EmbedBuilder,
  ColorResolvable,
  APIEmbedField,
  AttachmentBuilder
} from 'discord.js';
import { DocumentData } from 'firebase-admin/firestore';

/**
 * Format Firestore document data into a Discord embed
 */
export function formatDocumentEmbed(
  documentData: DocumentData,
  collectionName: string,
  documentId: string,
  color: ColorResolvable = '#4285F4'
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(`Document: ${documentId}`)
    .setDescription(`Collection: ${collectionName}`)
    .setColor(color)
    .setTimestamp();

  // Add fields for each property
  const fields: APIEmbedField[] = Object.entries(documentData)
    .filter(([key]) => key !== 'id') // Skip ID field as it's already in the title
    .map(([key, value]) => ({
      name: key,
      value: formatValue(value),
      inline: getValueSize(value) < 30 // Make small values inline
    }));

  // Add fields to embed (max 25 fields per embed)
  if (fields.length <= 25) {
    embed.addFields(fields);
  } else {
    // If more than 25 fields, add first 25 and note that there are more
    embed.addFields(fields.slice(0, 25));
    embed.setFooter({
      text: `Showing 25/${fields.length} fields. Some fields were truncated due to Discord limits.`
    });
  }

  return embed;
}

/**
 * Format a collection of documents into an embed with pagination
 */
export function formatCollectionEmbed(
  documents: DocumentData[],
  collectionName: string,
  page: number = 1,
  pageSize: number = 10,
  color: ColorResolvable = '#4285F4'
): EmbedBuilder {
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, documents.length);
  const pageDocuments = documents.slice(startIndex, endIndex);

  const embed = new EmbedBuilder()
    .setTitle(`Collection: ${collectionName}`)
    .setDescription(`Showing ${startIndex + 1}-${endIndex} of ${documents.length} documents`)
    .setColor(color)
    .setTimestamp();

  if (pageDocuments.length === 0) {
    embed.setDescription('No documents found in this collection.');
    return embed;
  }

  // Add a field for each document with truncated content
  pageDocuments.forEach((doc) => {
    const id = doc.id || 'unknown';
    const previewFields = Object.entries(doc)
      .filter(([key]) => key !== 'id')
      .slice(0, 3) // Only show first 3 fields in preview
      .map(([key, value]) => `${key}: ${truncateValue(formatValue(value), 30)}`)
      .join('\n');

    embed.addFields({
      name: `📄 ${id}`,
      value: previewFields || 'Empty document',
      inline: false
    });
  });

  // Add pagination info
  const totalPages = Math.ceil(documents.length / pageSize);
  embed.setFooter({
    text: `Page ${page}/${totalPages} • Use ${page > 1 ? '⬅️ to go back' : ''}${
      page < totalPages && page > 1 ? ' or ' : ''
    }${page < totalPages ? '➡️ to see more' : ''}`
  });

  return embed;
}

/**
 * Format error messages into embeds
 */
export function formatErrorEmbed(
  error: Error | string,
  title: string = 'Error Occurred',
  color: ColorResolvable = '#FF0000'
): EmbedBuilder {
  const errorMessage = error instanceof Error ? error.message : error;

  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(errorMessage)
    .setColor(color)
    .setTimestamp();
}

/**
 * Format a value based on its type
 */
function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return 'null';
  }

  if (typeof value === 'object') {
    if (value instanceof Date) {
      return value.toISOString();
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return '[]';
      }

      return value.map(item => formatValue(item)).join(', ');
    }

    // Handle objects and references
    try {
      return JSON.stringify(value, null, 2);
    } catch (e) {
      return '[Complex Object]';
    }
  }

  return String(value);
}

/**
 * Get approximate size of a value for formatting decisions
 */
function getValueSize(value: any): number {
  const formatted = formatValue(value);
  return formatted.length;
}

/**
 * Truncate a string value to a maximum length
 */
function truncateValue(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return value.substring(0, maxLength - 3) + '...';
}

/**
 * Create a JSON attachment for large data
 */
export function createJsonAttachment(
  data: any,
  filename: string = 'data.json'
): AttachmentBuilder {
  const jsonString = JSON.stringify(data, null, 2);
  const buffer = Buffer.from(jsonString, 'utf-8');

  return new AttachmentBuilder(buffer, { name: filename });
}

export default {
  formatDocumentEmbed,
  formatCollectionEmbed,
  formatErrorEmbed,
  createJsonAttachment
};

