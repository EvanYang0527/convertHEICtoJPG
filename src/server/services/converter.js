import { mkdir, rm, stat } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { detectConverter, runConverter } from './cli-runner.js';

export async function convertHeicToJpg({
  sourcePath,
  outputDirectory,
  outputFileName
}) {
  if (!sourcePath) {
    throw new Error('sourcePath is required for conversion');
  }

  const converter = await detectConverter();
  const targetDirectory = outputDirectory ?? path.dirname(sourcePath);
  await mkdir(targetDirectory, { recursive: true });

  const outputName = outputFileName ?? `${path.parse(sourcePath).name}-${randomUUID()}.jpg`;
  const outputPath = path.join(targetDirectory, outputName);

  await runConverter(converter, sourcePath, outputPath);

  await stat(outputPath);

  return {
    outputPath,
    command: converter.command,
    tool: converter.description
  };
}

export async function safeUnlink(filePath) {
  if (!filePath) return;
  try {
    await rm(filePath, { force: true });
  } catch (error) {
    // Swallow errors to avoid masking the primary operation
    console.warn(`Failed to remove temporary file ${filePath}:`, error.message);
  }
}
