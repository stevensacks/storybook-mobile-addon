/* eslint-disable prefer-arrow/prefer-arrow-functions,unicorn/prefer-module */
function managerEntries(entry = []) {
    return [...entry, require.resolve('./dist/esm/preset/manager')];
}

module.exports = {
    managerEntries,
};
