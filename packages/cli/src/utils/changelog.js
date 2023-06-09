const path = require('path');

const { readFile } = require('./files');
const { getMetadata } = require('./metadata');

const isObject = (obj) => !!obj && typeof obj === 'object';

const isAppMetadata = (obj) =>
  isObject(obj) &&
  Object.hasOwn(obj, 'app_change_type') &&
  Object.hasOwn(obj, 'action_key') &&
  Object.hasOwn(obj, 'action_type');

const isIssueMetadata = (obj) =>
  isObject(obj) &&
  Object.hasOwn(obj, 'app_change_type') &&
  Object.hasOwn(obj, 'issue_id');

// Turns an empty array into undefined so it will not be present in the body when sent
const absentIfEmpty = (arr) => (arr.length === 0 ? undefined : arr);

const getChangelogFromMarkdown = (version, markdown) => {
  const lines = markdown
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n');

  let startingLine = lines.findIndex((line) =>
    RegExp(`^#{1,4} .*${version.replaceAll('.', '\\.')}`).test(line)
  );

  if (startingLine === -1) {
    throw new Error(`Version '${version}' not found in changelog`);
  }

  startingLine++;

  // Find the next line that starts with one or more '#' chars
  let endingLine = lines
    .slice(startingLine)
    .findIndex((line) => /^#{1,4} /.test(line));

  if (endingLine === -1) {
    endingLine = lines.length;
  }
  endingLine += startingLine;

  const changelogLines = lines.slice(startingLine, endingLine);
  const changelog = [];
  const appMetadata = [];
  const issueMetadata = [];

  for (const line of changelogLines) {
    for (const metadata of getMetadata(line)) {
      if (isAppMetadata(metadata)) {
        appMetadata.push(metadata);
      } else if (isIssueMetadata(metadata)) {
        issueMetadata.push(metadata);
      }
    }

    changelog.push(line);
  }

  return {
    changelog: changelog.join('\n').trim(),
    appMetadata: absentIfEmpty(appMetadata),
    issueMetadata: absentIfEmpty(issueMetadata),
  };
};

const getVersionChangelog = async (version, appDir = '.') => {
  const file = path.resolve(appDir, 'CHANGELOG.md');

  return readFile(file)
    .then((buffer) => getChangelogFromMarkdown(version, buffer.toString()))
    .catch(() => ({ changelog: '' })); // We're ignoring files that don't exist or that aren't readable
};

module.exports = {
  getVersionChangelog,
};
