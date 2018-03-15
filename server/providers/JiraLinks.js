module.exports = {
    boards: (name) => `/rest/agile/1.0/board?name=${name}`,
    username: () => '/rest/auth/1/session',
    sprints: (board) => `/rest/agile/1.0/board/${board}/sprint?state=active`,
    test: () => '/rest/api/latest/issue/LL-560',
    issues: () => `/rest/api/2/search`,
    issuesJQL: (name, label, sprints) => `(assignee=${name} OR labels=${label}) AND (updated>startOfDay() OR status in (review)) AND sprint in (${sprints})`,
};
