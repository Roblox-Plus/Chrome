import getCreatorGroups from './get-creator-groups';
import getUserGroups from './get-user-groups';

// To ensure the webpack service loader can discover the methods: import it, then export it again.
export { getCreatorGroups, getUserGroups };
