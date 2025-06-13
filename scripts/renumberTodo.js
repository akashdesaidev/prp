#!/usr/bin/env node
// scripts/renumberTodo.js
// Usage: node scripts/renumberTodo.js <inputFile> <outputFile>
// Reads a markdown todo file, adds section-number prefixes (1,2,3) and
// renumbers checklist items as 1.x, 2.x, 3.x respectively inside each phase.
// If outputFile is omitted, the input file will be overwritten.

const fs = require('fs');
const path = require('path');

function main() {
  const [, , inputPath, outputPath] = process.argv;
  if (!inputPath) {
    console.error('Usage: node scripts/renumberTodo.js <inputFile> [outputFile]');
    process.exit(1);
  }
  const filePath = path.resolve(inputPath);
  const outPath = path.resolve(outputPath || inputPath);

  const original = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  const result = [];

  let sectionPrefix = 0; // 1,2,3
  let taskCounter = 0;

  const SECTION_TITLES = [
    'Backend Setup',
    'Frontend Setup',
    'Integration & Testing',
    'Backend Tasks',
    'Frontend Tasks',
    'Integration & Testing',
  ];

  for (let line of original) {
    // Detect new phase – reset numbering
    if (/^##\s+📋\s+Phase/.test(line)) {
      sectionPrefix = 0;
      taskCounter = 0;
      result.push(line);
      continue;
    }

    // Detect section headings (### ...)
    // Match headings, optionally starting with an existing numeric prefix (e.g. "1 Backend Tasks")
    const sectionMatch = line.match(/^###\s+(?:\d+\s+)?(.+)/);
    if (sectionMatch) {
      const title = sectionMatch[1].trim(); // Extracted title without any numeric prefix
      if (SECTION_TITLES.includes(title)) {
        sectionPrefix += 1;
        taskCounter = 0;
        // Replace heading with numbered prefix
        const newLine = `### ${sectionPrefix} ${title}`;
        result.push(newLine);
        continue;
      }
    }

    // Detect task line
    const taskMatch = line.match(/^- \[( |x)]\s+(.*)$/i);
    if (taskMatch) {
      taskCounter += 1;
      const checked = taskMatch[1] === 'x' ? 'x' : ' ';
      // strip any existing numeric prefix after checkbox
      // Remove any existing numeric prefix (e.g., "1.1 ", "0.12 ") before re-applying
      const rest = taskMatch[2].replace(/^\d+\.\d+\s+|^\d+\.\s+/, '').trim();
      const newLine = `- [${checked}] ${sectionPrefix}.${taskCounter} ${rest}`;
      result.push(newLine);
      continue;
    }

    // Default push
    result.push(line);
  }

  fs.writeFileSync(outPath, result.join('\n'), 'utf8');
  console.log(`Renumbered todo saved to ${outPath}`);
}

main();
