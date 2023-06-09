const IntegrationBuilderMapping = {
  trigger: 'read',
  create: 'write',
  search: 'search',
};
const isValidAppType = (type) => type in IntegrationBuilderMapping;

const bugfixMatches = new Set(['fix', 'fixed', 'fixes']);
const featureUpdateMatches = new Set([
  'add',
  'adds',
  'added',
  'improve',
  'improves',
  'improved',
  'improvements',
  'update',
  'updates',
  'updated',
  'new',
]);

const extractMetadata = (token, context) => {
  if (!context) {
    return;
  }
  const issueMetadata = token.match(/#(?<issueId>\d+)/);
  if (Number.isInteger(Number(issueMetadata?.groups?.issueId))) {
    return {
      app_change_type: context,
      issue_id: Number(issueMetadata?.groups?.issueId),
    };
  }
  const appMetadata = token.match(
    /(?<actionType>(trigger|create|search))\/(?<actionKey>\w+)/
  );
  if (
    appMetadata?.groups?.actionKey &&
    isValidAppType(appMetadata.groups.actionType)
  ) {
    return {
      app_change_type: context,
      action_key: appMetadata.groups.actionKey,
      action_type: IntegrationBuilderMapping[appMetadata.groups.actionType],
    };
  }
};

function* metadataWalker(line) {
  let context;
  for (const token of line.split(' ')) {
    if (bugfixMatches.has(token.toLowerCase())) {
      context = 'BUGFIX';
    } else if (featureUpdateMatches.has(token.toLowerCase())) {
      context = 'FEATURE_UPDATE';
    }
    const metadata = extractMetadata(token, context);
    if (metadata) {
      yield metadata;
    }
  }
}

const getMetadata = (content) => Array.from(metadataWalker(content));

module.exports = { getMetadata };
