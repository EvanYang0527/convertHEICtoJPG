#!/usr/bin/env node
import path from 'path';
import { stat, mkdir, readdir } from 'fs/promises';
import process from 'process';
import { convertHeicToJpg } from '../src/server/services/converter.js';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--input' || arg === '-i') {
      args.input = argv[++i];
    } else if (arg === '--output' || arg === '-o') {
      args.output = argv[++i];
    } else if (arg === '--help' || arg === '-h') {
      args.help = true;
    }
  }
  return args;
}

function printHelp() {
  console.log(`Usage: npm run convert -- --input <path> [--output <path>]

  --input   Path to a HEIC file or a directory containing HEIC files.
  --output  Destination file (for single input) or directory.
`);
}

async function collectHeicFiles(entryPath) {
  const stats = await stat(entryPath);
  if (stats.isDirectory()) {
    const entries = await readdir(entryPath, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      const childPath = path.join(entryPath, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await collectHeicFiles(childPath)));
      } else if (/\.heic$/i.test(entry.name)) {
        files.push(childPath);
      }
    }
    return files;
  }

  if (/\.heic$/i.test(path.basename(entryPath))) {
    return [entryPath];
  }

  throw new Error('Input must be a HEIC file or a directory containing HEIC files.');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || !args.input) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }

  const inputPath = path.resolve(args.input);
  const outputArgument = args.output ? path.resolve(args.output) : null;

  const heicFiles = await collectHeicFiles(inputPath);
  if (heicFiles.length === 0) {
    console.log('No HEIC files found to convert.');
    return;
  }

  console.log(`Detected ${heicFiles.length} HEIC file(s). Starting conversion...`);

  for (const filePath of heicFiles) {
    const outputDirectory = outputArgument
      ? (heicFiles.length === 1 && outputArgument.toLowerCase().endsWith('.jpg')
          ? path.dirname(outputArgument)
          : outputArgument)
      : path.join(path.dirname(filePath), 'converted');

    const outputFileName = outputArgument && heicFiles.length === 1 && outputArgument.toLowerCase().endsWith('.jpg')
      ? path.basename(outputArgument)
      : undefined;

    await mkdir(outputDirectory, { recursive: true });
    const { outputPath, command } = await convertHeicToJpg({
      sourcePath: filePath,
      outputDirectory,
      outputFileName
    });
    console.log(`✔ Converted ${filePath} -> ${outputPath} using ${command}`);
  }

  console.log('All conversions completed.');
}

main().catch((error) => {
  console.error('Conversion failed:', error.message);
  process.exit(1);
});
